# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::AccountLinks', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:user) { create(:user, :student) }
  let!(:cookie) { login_and_get_cookie(user) }

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: headers
    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'POST /api/v1/student/account_link' do
    subject do
      post '/api/v1/student/account_link',
           params: params.to_json,
           headers: headers.merge('Cookie' => cookie)
    end

    context '正常系' do
      let!(:target_user) do
        create(:user, :student, :invitation_pending, :with_school_class,
               student_number: 'AB12-CD3456', high_school: user.high_school)
      end
      let(:params) { { student_number: 'AB12-CD3456' } }

      it 'ステータス200が返される' do
        subject

        expect(response).to have_http_status(:ok)
      end

      it 'ログイン中Userへ学校情報が統合される' do
        subject

        user.reload
        expect(user.student_number).to eq('AB12-CD3456')
      end

      it '仮Userが削除される' do
        subject

        expect(User.exists?(target_user.id)).to be(false)
      end
    end

    context '異常系' do
      context '存在しないstudent_numberを指定した場合' do
        let(:params) { { student_number: 'ZZ99-NOTFOUND1' } }

        it '404を返す' do
          subject

          expect(response).to have_http_status(:not_found)
        end
      end

      context 'student_numberが空の場合' do
        let(:params) { { student_number: '' } }

        it '400を返す' do
          subject

          expect(response).to have_http_status(:bad_request)
        end
      end

      context '自分自身が既に紐付け済みのstudent_numberを指定した場合' do
        let!(:user) { create(:user, :student, student_number: 'SELF-000001') }
        let(:params) { { student_number: 'SELF-000001' } }

        it '400を返す' do
          subject

          expect(response).to have_http_status(:bad_request)
        end
      end

      context '既に有効化済みのUserのstudent_numberを指定した場合' do
        let!(:target_user) do
          create(:user, :student, :invitation_completed, :with_school_class, student_number: 'ACT-000001')
        end
        let(:params) { { student_number: 'ACT-000001' } }

        it '400を返す' do
          subject

          expect(response).to have_http_status(:bad_request)
        end
      end

      context '仮Userに関連データが存在する場合' do
        let!(:target_user) do
          create(:user, :student, :invitation_pending, :with_school_class,
                 student_number: 'DEP-000001', high_school: user.high_school)
        end
        let(:params) { { student_number: 'DEP-000001' } }

        before { create(:study_log, user: target_user, task: create(:task, user: target_user)) }

        it '400を返す' do
          subject

          expect(response).to have_http_status(:bad_request)
        end
      end

      context 'student_numberの学校がログイン中Userの学校と異なる場合' do
        let!(:target_user) do
          create(:user, :student, :invitation_pending, :with_school_class, student_number: 'SCH-000001')
        end
        let(:params) { { student_number: 'SCH-000001' } }

        it '400を返す' do
          subject

          expect(response).to have_http_status(:bad_request)
        end
      end

      context '生徒以外のロールでアクセスした場合' do
        let!(:teacher) { create(:user, :teacher) }
        let!(:cookie) { login_and_get_cookie(teacher) }
        let(:params) { { student_number: 'AB12-CD3456' } }

        it '403を返す' do
          subject

          expect(response).to have_http_status(:forbidden)
        end
      end
    end

    context 'レート制限' do
      let(:params) { { student_number: 'ZZ99-NOTFOUND1' } }

      def request_account_link
        post '/api/v1/student/account_link',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)
      end

      before { Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new }

      it '制限回数(5回)以内は都度リクエストが処理される' do
        5.times do
          request_account_link
          expect(response).not_to have_http_status(:too_many_requests)
        end
      end

      it '制限回数を超えると429を返す' do
        6.times { request_account_link }

        expect(response).to have_http_status(:too_many_requests)
      end

      it '制限時間経過後は再度リクエストできる' do
        6.times { request_account_link }
        expect(response).to have_http_status(:too_many_requests)

        travel 11.minutes do
          request_account_link
          expect(response).not_to have_http_status(:too_many_requests)
        end
      end
    end
  end
end
