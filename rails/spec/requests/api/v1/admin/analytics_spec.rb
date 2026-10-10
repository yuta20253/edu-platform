# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Analytics', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: headers
    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/admin/analytics' do
    context '正常系' do
      subject { get '/api/v1/admin/analytics', params: params, headers: headers.merge('Cookie' => cookie) }

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let(:cookie) { login_and_get_cookie(admin_user) }
      let(:params) { {} }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'kpisに4つのKPIが揃っている' do
        subject
        expect(response.parsed_body['kpis'].keys).to contain_exactly(
          'active_student_count', 'answer_count', 'accuracy_rate', 'study_minutes'
        )
      end

      it 'kpisの各要素がcurrent/previousの組で返る' do
        subject
        expect(response.parsed_body.dig('kpis', 'answer_count').keys).to contain_exactly('current', 'previous')
      end

      it 'daily_activityがfrom..toの全日分返る(既定は直近30日)' do
        subject
        expect(response.parsed_body['daily_activity'].size).to eq(30)
      end

      it 'low_accuracy_units/low_accuracy_questions/high_school_usageが空配列で返る' do
        subject
        expect(response.parsed_body['low_accuracy_units']).to eq([])
        expect(response.parsed_body['low_accuracy_questions']).to eq([])
        expect(response.parsed_body['high_school_usage']).to eq([])
      end

      it 'content_coverageの3値が返る' do
        subject
        expect(response.parsed_body['content_coverage'].keys).to contain_exactly(
          'total_units', 'units_without_questions', 'units_without_answers'
        )
      end

      it 'metaにfrom/to/min_answer_count/ranking_limit/max_range_daysが返る' do
        subject
        meta = response.parsed_body['meta']
        expect(meta).to include(
          'min_answer_count' => Admin::AnalyticsQuery::MIN_ANSWER_COUNT,
          'ranking_limit' => Admin::AnalyticsQuery::RANKING_LIMIT,
          'max_range_days' => Admin::AnalyticsQuery::MAX_RANGE_DAYS
        )
        expect(meta['from']).to be_present
        expect(meta['to']).to be_present
      end

      context 'from/toを指定した場合' do
        let(:params) { { from: '2026-08-01', to: '2026-08-10' } }

        it '指定した期間がmetaに反映される' do
          subject
          expect(response.parsed_body.dig('meta', 'from')).to eq('2026-08-01')
          expect(response.parsed_body.dig('meta', 'to')).to eq('2026-08-10')
        end

        it 'daily_activityが指定した日数分返る' do
          subject
          expect(response.parsed_body['daily_activity'].size).to eq(10)
        end
      end

      context 'high_school_idを指定した場合' do
        let!(:target_school) { create(:high_school) }
        let(:params) { { high_school_id: target_school.id } }

        it '指定した高校のみhigh_school_usageに含める' do
          create(:user, high_school: target_school)
          create(:user, high_school: create(:high_school))

          subject
          ids = response.parsed_body['high_school_usage'].pluck('high_school_id')
          expect(ids).to eq([target_school.id])
        end
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返される' do
        get '/api/v1/admin/analytics', headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 管理者以外のアクセス（生徒）' do
      let!(:student_user) { create(:user) }

      it '403が返される' do
        cookie = login_and_get_cookie(student_user)
        get '/api/v1/admin/analytics', headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context '異常系 - 期間が不正な場合' do
      subject { get '/api/v1/admin/analytics', params: params, headers: headers.merge('Cookie' => cookie) }

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let(:cookie) { login_and_get_cookie(admin_user) }

      context 'fromがtoより後の場合' do
        let(:params) { { from: '2026-08-31', to: '2026-08-01' } }

        it '422が返される' do
          subject
          expect(response).to have_http_status(:unprocessable_content)
        end

        it 'errorsが返される' do
          subject
          expect(response.parsed_body['errors']).to be_present
        end
      end

      context '期間が366日を超える場合' do
        let(:params) { { from: '2026-01-01', to: '2027-01-02' } }

        it '422が返される' do
          subject
          expect(response).to have_http_status(:unprocessable_content)
        end
      end

      context 'fromが不正な日付形式の場合' do
        let(:params) { { from: 'invalid-date' } }

        it '422が返される' do
          subject
          expect(response).to have_http_status(:unprocessable_content)
        end
      end
    end
  end
end
