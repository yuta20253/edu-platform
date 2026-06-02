# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Courses', type: :request do
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

  describe 'GET /api/v1/admin/courses' do
    context '正常系 - 講座が存在しない場合' do
      subject { get '/api/v1/admin/courses', headers: headers.merge('Cookie' => cookie) }

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let(:cookie) { login_and_get_cookie(admin_user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'courses は空配列、meta は 0件の値を返す' do
        subject
        body = response.parsed_body
        expect(body['courses']).to eq([])
        expect(body['meta']).to include(
          'current_page' => 1,
          'total_pages' => 0,
          'total_count' => 0,
          'per_page' => 20
        )
      end
    end

    context '正常系 - 1件の講座が存在する場合' do
      subject { get '/api/v1/admin/courses', headers: headers.merge('Cookie' => cookie) }

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:subject_record) { create(:subject, name: '英語') }
      let!(:course) do
        create(:course, subject: subject_record, level_name: '基礎', level_number: 1)
      end
      let(:cookie) { login_and_get_cookie(admin_user) }

      it '必要なフィールドが含まれる' do
        subject
        item = response.parsed_body['courses'].first
        expect(item.keys).to include('id', 'name', 'subject', 'level_number',
                                     'units_count', 'questions_count', 'created_at')
      end

      it 'name は level_name を返す' do
        subject
        expect(response.parsed_body['courses'].first['name']).to eq('基礎')
      end

      it 'subject は id と name を含む' do
        subject
        expect(response.parsed_body['courses'].first['subject']).to eq(
          'id' => subject_record.id, 'name' => '英語'
        )
      end

      it 'id / level_number / units_count / questions_count が正しい' do
        subject
        item = response.parsed_body['courses'].first
        expect(item['id']).to eq(course.id)
        expect(item['level_number']).to eq(1)
        expect(item['units_count']).to eq(0)
        expect(item['questions_count']).to eq(0)
      end

      it 'meta.total_count が 1 になる' do
        subject
        expect(response.parsed_body['meta']['total_count']).to eq(1)
      end
    end

    context 'ページネーション' do
      subject { get '/api/v1/admin/courses', params: query_params, headers: headers.merge('Cookie' => cookie) }

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:subject_record) { create(:subject) }
      let(:cookie) { login_and_get_cookie(admin_user) }

      before do
        25.times { |i| create(:course, subject: subject_record, level_name: "Lv#{i}") }
      end

      context 'デフォルト per_page=20' do
        let(:query_params) { {} }

        it '20件返し、meta に current_page/per_page/total_count が入る' do
          subject
          body = response.parsed_body
          expect(body['courses'].size).to eq(20)
          expect(body['meta']).to include('current_page' => 1, 'per_page' => 20, 'total_count' => 25)
        end
      end

      context 'page=2 を指定' do
        let(:query_params) { { page: 2 } }

        it '残り5件を返し、current_page=2 になる' do
          subject
          body = response.parsed_body
          expect(body['courses'].size).to eq(5)
          expect(body['meta']['current_page']).to eq(2)
        end
      end

      context 'per_page=5 を指定' do
        let(:query_params) { { per_page: 5 } }

        it '5件返し、meta.per_page=5 になる' do
          subject
          body = response.parsed_body
          expect(body['courses'].size).to eq(5)
          expect(body['meta']['per_page']).to eq(5)
        end
      end

      context 'per_page=150 を指定（上限超過）' do
        let(:query_params) { { per_page: 150 } }

        it 'meta.per_page は 100 に丸められる' do
          subject
          expect(response.parsed_body['meta']['per_page']).to eq(100)
        end
      end

      context 'per_page=0 や負数を指定' do
        let(:query_params) { { per_page: 0 } }

        it 'デフォルト 20 にフォールバックする' do
          subject
          expect(response.parsed_body['meta']['per_page']).to eq(20)
        end
      end
    end

    context 'subject_id パラメータ指定時' do
      subject do
        get '/api/v1/admin/courses',
            params: { subject_id: subject_a.id },
            headers: headers.merge('Cookie' => cookie)
      end

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:subject_a) { create(:subject, name: '英語') }
      let!(:subject_b) { create(:subject, name: '数学') }
      let!(:course_a) { create(:course, subject: subject_a) }
      let!(:course_b) { create(:course, subject: subject_b) }
      let(:cookie) { login_and_get_cookie(admin_user) }

      it '指定教科の講座のみ返す' do
        subject
        ids = response.parsed_body['courses'].pluck('id')
        expect(ids).to include(course_a.id)
        expect(ids).not_to include(course_b.id)
      end
    end
  end

  describe 'GET /api/v1/admin/courses/:id' do
    context '正常系' do
      subject { get "/api/v1/admin/courses/#{course.id}", headers: headers.merge('Cookie' => cookie) }

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:subject_record) { create(:subject, name: '数学') }
      let!(:course) do
        create(:course,
               subject: subject_record,
               level_number: 2,
               level_name: '標準',
               description: '標準レベルのコース')
      end
      let!(:units) { create_list(:unit, 2, course: course) }

      let(:cookie) { login_and_get_cookie(admin_user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it '講座の基本フィールドが含まれる' do
        subject
        body = response.parsed_body
        expect(body.keys).to include('id', 'subject', 'level_number', 'level_name', 'description', 'units')
      end

      it 'id / level_number / level_name / description が正しい' do
        subject
        body = response.parsed_body
        expect(body['id']).to eq(course.id)
        expect(body['level_number']).to eq(2)
        expect(body['level_name']).to eq('標準')
        expect(body['description']).to eq('標準レベルのコース')
      end

      it 'subject は id と name を含む' do
        subject
        body = response.parsed_body
        expect(body['subject']).to eq('id' => subject_record.id, 'name' => '数学')
      end

      it 'units 配列に course に紐づく全 unit が id 昇順で含まれる' do
        subject
        body = response.parsed_body
        unit_ids = body['units'].pluck('id')
        expect(unit_ids).to eq(units.map(&:id).sort)
      end

      it '各 unit に id / unit_name が含まれる' do
        subject
        body = response.parsed_body
        unit_data = body['units'].first
        expect(unit_data.keys).to include('id', 'unit_name')
      end

      context 'unit に紐づく問題が存在する場合' do
        let!(:questions_for_first_unit) { create_list(:question, 3, unit: units.first) }
        let!(:questions_for_second_unit) { create_list(:question, 1, unit: units.last) }

        it '各 unit に questions_count が含まれ、正しい数が返る' do
          subject
          body = response.parsed_body
          counts = body['units'].to_h { |u| [u['id'], u['questions_count']] }
          expect(counts[units.first.id]).to eq(3)
          expect(counts[units.last.id]).to eq(1)
        end
      end

      context 'unit に紐づく問題が存在しない場合' do
        it 'questions_count は 0 として返る' do
          subject
          body = response.parsed_body
          expect(body['units'].pluck('questions_count')).to all(eq(0))
        end
      end
    end

    context '異常系 - 未認証アクセス' do
      let!(:course) { create(:course) }

      it '401が返される' do
        get "/api/v1/admin/courses/#{course.id}", headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 管理者以外のアクセス（生徒）' do
      let!(:student_user) { create(:user) }
      let!(:course) { create(:course) }

      it '403が返される' do
        cookie = login_and_get_cookie(student_user)
        get "/api/v1/admin/courses/#{course.id}", headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context '異常系 - 管理者以外のアクセス（教員）' do
      let!(:teacher_user) { create(:user, :teacher) }
      let!(:course) { create(:course) }

      it '403が返される' do
        cookie = login_and_get_cookie(teacher_user)
        get "/api/v1/admin/courses/#{course.id}", headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context '異常系 - 存在しない id' do
      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let(:cookie) { login_and_get_cookie(admin_user) }

      it '404が返される' do
        get '/api/v1/admin/courses/0', headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
