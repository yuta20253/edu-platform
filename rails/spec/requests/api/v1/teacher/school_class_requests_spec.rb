# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::SchoolClassRequests', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:high_school) { create(:high_school) }
  let!(:grade) do
    create(
      :grade,
      high_school: high_school
    )
  end
  let!(:teacher) do
    create(:user, :teacher, high_school: high_school)
  end
  let!(:teacher_permission) do
    create(
      :teacher_permission,
      user: teacher,
      manage_other_teachers: true
    )
  end
  let(:cookie) { login_and_get_cookie(teacher) }

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: {
           email: user.email,
           password: 'password'
         }.to_json,
         headers: headers

    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/teacher/school_class_requests' do
    let!(:other_teacher) { create(:user, :teacher, high_school: high_school) }
    let!(:own_request) do
      create(:school_class_request, applicant: teacher, grade: grade, action: :creation, status: :pending, name: '1組')
    end
    let!(:other_teacher_request) do
      create(:school_class_request, applicant: other_teacher, grade: grade, action: :creation, status: :pending,
                                    name: '2組')
    end

    let!(:other_high_school) { create(:high_school) }
    let!(:other_grade) { create(:grade, high_school: other_high_school) }
    let!(:other_school_teacher) { create(:user, :teacher, high_school: other_high_school) }
    let!(:other_school_request) do
      create(:school_class_request, applicant: other_school_teacher, grade: other_grade, action: :creation,
                                    status: :pending, name: '3組')
    end

    def request_ids
      response.parsed_body['school_class_requests'].pluck('id')
    end

    context '承認権限がある場合' do
      it '200が返る' do
        get '/api/v1/teacher/school_class_requests', headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '同じ高校の全教員の申請が返る' do
        get '/api/v1/teacher/school_class_requests', headers: headers.merge('Cookie' => cookie)

        expect(request_ids).to contain_exactly(own_request.id, other_teacher_request.id)
      end

      it '申請日時の新しい順に返る' do
        # id順(own_request → other_teacher_request)とは逆になるように作成日時をずらす
        own_request.update_column(:created_at, 2.days.ago)
        other_teacher_request.update_column(:created_at, 1.day.ago)

        get '/api/v1/teacher/school_class_requests', headers: headers.merge('Cookie' => cookie)

        expect(request_ids).to eq([other_teacher_request.id, own_request.id])
      end

      it '申請日時が同じ場合はidの大きい順に返る' do
        same_time = 1.day.ago
        own_request.update_column(:created_at, same_time)
        other_teacher_request.update_column(:created_at, same_time)

        get '/api/v1/teacher/school_class_requests', headers: headers.merge('Cookie' => cookie)

        expect(request_ids).to eq([other_teacher_request.id, own_request.id])
      end

      context 'statusを指定した場合' do
        before { other_teacher_request.update_column(:status, SchoolClassRequest.statuses[:rejected]) }

        it '指定したstatusの申請だけが返る' do
          get '/api/v1/teacher/school_class_requests',
              params: { status: 'rejected' },
              headers: headers.merge('Cookie' => cookie)

          expect(request_ids).to contain_exactly(other_teacher_request.id)
        end
      end

      context 'per_pageとpageを指定した場合' do
        it '指定したページの申請とページ情報が返る' do
          get '/api/v1/teacher/school_class_requests',
              params: { page: 2, per_page: 1 },
              headers: headers.merge('Cookie' => cookie)

          expect(request_ids.size).to eq(1)
          expect(response.parsed_body['meta']).to eq(
            'current_page' => 2,
            'total_pages' => 2,
            'total_count' => 2,
            'per_page' => 1
          )
        end
      end

      it '件数によらずクエリ件数が増えない(N+1にならない)' do
        request_headers = headers.merge('Cookie' => cookie)

        count_queries = lambda do
          queries = []
          callback = ->(_n, _s, _f, _id, payload) { queries << payload[:sql] if payload[:name] != 'SCHEMA' }
          ActiveSupport::Notifications.subscribed(callback, 'sql.active_record') do
            get '/api/v1/teacher/school_class_requests', headers: request_headers
          end
          queries.size
        end

        # 申請者・承認者・学級・学年がそれぞれ別のレコードになる申請を作る
        create_processed_request = lambda do |i|
          applicant = create(:user, :teacher, high_school: high_school)
          approver = create(:user, :teacher, high_school: high_school)
          extra_grade = create(:grade, high_school: high_school)
          extra_school_class = create(:school_class, grade: extra_grade, name: "追加#{i}組")
          create(:school_class_request, applicant: applicant, approver: approver, grade: extra_grade,
                                        school_class: extra_school_class, action: :modification,
                                        status: :approved, name: "変更#{i}組")
        end

        # 承認者・学級が1件も無いとpreloadのクエリ自体が省かれるため、比較の基準にも1件含めておく
        create_processed_request.call(0)
        base_count = count_queries.call

        (1..3).each { |i| create_processed_request.call(i) }

        expect(count_queries.call).to eq(base_count)
      end

      context '存在しないstatusを指定した場合' do
        it '申請が1件も返らない' do
          get '/api/v1/teacher/school_class_requests',
              params: { status: 'unknown' },
              headers: headers.merge('Cookie' => cookie)

          expect(response).to have_http_status(:ok)
          expect(request_ids).to be_empty
        end
      end
    end

    context '承認権限がない場合' do
      before { teacher_permission.update!(manage_other_teachers: false) }

      it '200が返る' do
        get '/api/v1/teacher/school_class_requests', headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '自分の申請だけが返る' do
        get '/api/v1/teacher/school_class_requests', headers: headers.merge('Cookie' => cookie)

        expect(request_ids).to contain_exactly(own_request.id)
      end
    end
  end

  describe 'GET /api/v1/teacher/school_class_requests/:id' do
    let!(:other_teacher) { create(:user, :teacher, high_school: high_school, name: '申請 太郎') }
    let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }
    let!(:school_class_request) do
      create(:school_class_request, applicant: other_teacher, grade: grade, school_class: school_class,
                                    action: :modification, status: :pending, name: 'B組',
                                    approved_at: nil, cancelled_at: nil)
    end

    context '承認権限がある場合' do
      it '200が返る' do
        get "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '申請の詳細が返る' do
        get "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response.parsed_body).to include(
          'id' => school_class_request.id,
          'action' => 'modification',
          'status' => 'pending',
          'name' => 'B組',
          'reason' => nil,
          'lock_version' => school_class_request.lock_version,
          'grade' => { 'id' => grade.id, 'year' => grade.year, 'display_name' => grade.display_name },
          'school_class' => { 'id' => school_class.id, 'name' => 'A組' },
          'applicant' => { 'id' => other_teacher.id, 'name' => '申請 太郎' },
          'approver' => nil
        )
      end

      it 'statusパラメータを付けても、申請のstatusに関係なく取得できる' do
        get "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
            params: { status: 'approved' },
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '新設の申請ではschool_classがnullで返る' do
        creation_request = create(:school_class_request, applicant: other_teacher, grade: grade, action: :creation,
                                                         status: :pending, name: 'E組')

        get "/api/v1/teacher/school_class_requests/#{creation_request.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response.parsed_body['school_class']).to be_nil
      end

      it '承認済みの申請では承認者が返る' do
        school_class_request.update_columns(status: SchoolClassRequest.statuses[:approved], approver_id: teacher.id)

        get "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response.parsed_body['approver']).to eq('id' => teacher.id, 'name' => teacher.name)
      end
    end

    context '承認権限がない場合' do
      before { teacher_permission.update!(manage_other_teachers: false) }

      it '自分の申請は取得できる' do
        own_request = create(:school_class_request, applicant: teacher, grade: grade, action: :creation,
                                                    status: :pending, name: 'C組')

        get "/api/v1/teacher/school_class_requests/#{own_request.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '他の教員の申請は404が返る' do
        get "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end

    describe '操作できるかどうか(can_process / can_cancel)' do
      let!(:own_request) do
        create(:school_class_request, applicant: teacher, grade: grade, action: :creation, status: :pending,
                                      name: 'F組')
      end

      def fetch_permissions(request)
        get "/api/v1/teacher/school_class_requests/#{request.id}", headers: headers.merge('Cookie' => cookie)

        response.parsed_body.slice('can_process', 'can_cancel')
      end

      context '承認権限がある場合' do
        it '他の教員の承認待ちの申請は、承認/却下できて取り消せない' do
          expect(fetch_permissions(school_class_request)).to eq('can_process' => true, 'can_cancel' => false)
        end

        it '自分の承認待ちの申請は、承認/却下できず取り消せる' do
          expect(fetch_permissions(own_request)).to eq('can_process' => false, 'can_cancel' => true)
        end

        it '処理済みの申請は、承認/却下も取消もできない' do
          school_class_request.update_column(:status, SchoolClassRequest.statuses[:rejected])
          own_request.update_column(:status, SchoolClassRequest.statuses[:cancelled])

          expect(fetch_permissions(school_class_request)).to eq('can_process' => false, 'can_cancel' => false)
          expect(fetch_permissions(own_request)).to eq('can_process' => false, 'can_cancel' => false)
        end
      end

      context '承認権限がない場合' do
        before { teacher_permission.update!(manage_other_teachers: false) }

        it '自分の承認待ちの申請は、承認/却下できず取り消せる' do
          expect(fetch_permissions(own_request)).to eq('can_process' => false, 'can_cancel' => true)
        end
      end
    end

    context '他校の申請の場合' do
      let!(:other_high_school) { create(:high_school) }
      let!(:other_grade) { create(:grade, high_school: other_high_school) }
      let!(:other_school_teacher) { create(:user, :teacher, high_school: other_high_school) }
      let!(:other_school_request) do
        create(:school_class_request, applicant: other_school_teacher, grade: other_grade, action: :creation,
                                      status: :pending, name: 'D組')
      end

      it '404が返る' do
        get "/api/v1/teacher/school_class_requests/#{other_school_request.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end

    context '存在しない申請の場合' do
      it '404が返る' do
        get '/api/v1/teacher/school_class_requests/999999', headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end

    context '未認証の場合' do
      it 'アクセスできない' do
        get "/api/v1/teacher/school_class_requests/#{school_class_request.id}", headers: headers

        expect(response).not_to have_http_status(:ok)
      end
    end
  end

  describe 'POST /api/v1/teacher/school_class_requests' do
    let(:params) do
      {
        school_class_request: {
          name: '1組',
          grade_id: grade.id,
          action: 'creation'
        }
      }
    end

    context '正常系' do
      it '201が返る' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:created)
      end

      it '学級作成申請が作成される' do
        expect do
          post '/api/v1/teacher/school_class_requests',
               params: params.to_json,
               headers: headers.merge('Cookie' => cookie)
        end.to change(SchoolClassRequest, :count).by(1)
      end

      it '申請内容が保存される' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        school_class_request = SchoolClassRequest.last

        expect(school_class_request.applicant).to eq(teacher)
        expect(school_class_request.grade).to eq(grade)
        expect(school_class_request.name).to eq('1組')
        expect(school_class_request.action).to eq('creation')
        expect(school_class_request.status).to eq('pending')
      end

      it '受付完了メッセージが返る' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['message']).to eq('学級作成申請を受け付けました')
      end
    end

    context 'nameが未入力の場合' do
      let(:params) do
        {
          school_class_request: {
            name: '',
            grade_id: grade.id,
            action: 'creation'
          }
        }
      end

      it '422が返る' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end

      it '学級作成申請が作成されない' do
        expect do
          post '/api/v1/teacher/school_class_requests',
               params: params.to_json,
               headers: headers.merge('Cookie' => cookie)
        end.not_to change(SchoolClassRequest, :count)
      end

      it 'エラーメッセージが返る' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['errors']).to include('クラス名 を入力してください')
      end
    end

    context 'grade_idが未入力の場合' do
      let(:params) do
        {
          school_class_request: {
            name: '1組',
            grade_id: nil,
            action: 'creation'
          }
        }
      end

      it '422が返る' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end

      it '学級作成申請が作成されない' do
        expect do
          post '/api/v1/teacher/school_class_requests',
               params: params.to_json,
               headers: headers.merge('Cookie' => cookie)
        end.not_to change(SchoolClassRequest, :count)
      end
    end

    context '他高校のgrade_idを指定した場合' do
      let!(:other_high_school) { create(:high_school) }

      let!(:other_grade) do
        create(
          :grade,
          high_school: other_high_school
        )
      end

      let(:params) do
        {
          school_class_request: {
            name: '1組',
            grade_id: other_grade.id,
            action: 'creation'
          }
        }
      end

      it '422が返る' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end

      it '学級作成申請が作成されない' do
        expect do
          post '/api/v1/teacher/school_class_requests',
               params: params.to_json,
               headers: headers.merge('Cookie' => cookie)
        end.not_to change(SchoolClassRequest, :count)
      end
    end

    context '未認証の場合' do
      it 'アクセスできない' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers

        expect(response).not_to have_http_status(:created)
      end
    end

    context 'クラス更新申請の場合' do
      let!(:school_class) { create(:school_class, grade: grade, name: '旧1組') }
      let(:params) do
        {
          school_class_request: {
            name: '新1組',
            grade_id: grade.id,
            action: 'modification',
            school_class_id: school_class.id
          }
        }
      end

      it '201が返る' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:created)
      end

      it 'action=modificationで申請が作成される' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        school_class_request = SchoolClassRequest.last

        expect(school_class_request.action).to eq('modification')
        expect(school_class_request.school_class_id).to eq(school_class.id)
      end

      it 'クラスは変更されない' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(school_class.reload.name).to eq('旧1組')
      end
    end

    context 'クラス削除申請の場合' do
      let!(:school_class) { create(:school_class, grade: grade, name: '1組') }
      let(:params) do
        {
          school_class_request: {
            grade_id: grade.id,
            action: 'deletion',
            school_class_id: school_class.id
          }
        }
      end

      it '201が返る' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:created)
      end

      it 'action=deletionで申請が作成される' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        school_class_request = SchoolClassRequest.last

        expect(school_class_request.action).to eq('deletion')
        expect(school_class_request.school_class_id).to eq(school_class.id)
      end

      it 'クラスは削除されない' do
        expect do
          post '/api/v1/teacher/school_class_requests',
               params: params.to_json,
               headers: headers.merge('Cookie' => cookie)
        end.not_to change(SchoolClass, :count)
      end

      context 'クラスに生徒が所属している場合' do
        let!(:student) do
          create(:user, :student, high_school: high_school, grade: grade, school_class: school_class)
        end

        it '422が返る' do
          post '/api/v1/teacher/school_class_requests',
               params: params.to_json,
               headers: headers.merge('Cookie' => cookie)

          expect(response).to have_http_status(:unprocessable_content)
        end

        it '削除申請が作成されない' do
          expect do
            post '/api/v1/teacher/school_class_requests',
                 params: params.to_json,
                 headers: headers.merge('Cookie' => cookie)
          end.not_to change(SchoolClassRequest, :count)
        end

        it '属性名を日本語にしたエラーメッセージが返る' do
          post '/api/v1/teacher/school_class_requests',
               params: params.to_json,
               headers: headers.merge('Cookie' => cookie)

          expect(response.parsed_body['errors'])
            .to include('対象クラス は生徒または教員が所属しているため削除できません')
        end
      end
    end
  end

  describe 'PATCH /api/v1/teacher/school_class_requests/:id' do
    let!(:school_class_request) do
      create(
        :school_class_request,
        applicant: teacher,
        grade: grade,
        action: :creation,
        status: :pending,
        name: '1組'
      )
    end

    let!(:approver) { create(:user, :teacher, high_school: high_school) }
    let!(:approver_permission) do
      create(
        :teacher_permission,
        user: approver,
        manage_other_teachers: true
      )
    end
    let(:approver_cookie) { login_and_get_cookie(approver) }

    let(:request_lock_version) { school_class_request.lock_version }

    let(:request_params) do
      {
        school_class_request: {
          status: status,
          lock_version: request_lock_version
        }
      }
    end

    context '承認する場合' do
      let(:status) { 'approved' }

      it '200が返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        expect(response).to have_http_status(:ok)
      end

      it '申請が承認済みになる' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        expect(school_class_request.reload.status).to eq('approved')
      end

      it '承認者が保存される' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        expect(school_class_request.reload.approver).to eq(approver)
      end

      it 'approved_atが保存される' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        expect(school_class_request.reload.approved_at).to be_present
      end

      it '学級が作成される' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => approver_cookie)
        end.to change(SchoolClass, :count).by(1)
      end

      it '申請の内容で学級が作成される' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        school_class = SchoolClass.last

        expect(school_class.grade).to eq(grade)
        expect(school_class.name).to eq('1組')
      end

      it '承認メッセージが返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        json = response.parsed_body

        expect(json['message']).to eq('申請が承認されました')
      end
    end

    context '更新申請を承認する場合' do
      let!(:target_school_class) { create(:school_class, grade: grade, name: '旧1組') }
      let!(:school_class_request) do
        create(
          :school_class_request,
          applicant: teacher,
          grade: grade,
          school_class: target_school_class,
          action: :modification,
          status: :pending,
          name: '新1組'
        )
      end
      let(:status) { 'approved' }

      it 'クラス名が更新される' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        expect(target_school_class.reload.name).to eq('新1組')
      end
    end

    context '削除申請を承認する場合' do
      let!(:target_school_class) { create(:school_class, grade: grade, name: '1組') }
      let!(:school_class_request) do
        create(
          :school_class_request,
          applicant: teacher,
          grade: grade,
          school_class: target_school_class,
          action: :deletion,
          status: :pending,
          name: nil
        )
      end
      let(:status) { 'approved' }

      it 'クラスが削除される' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => approver_cookie)
        end.to change(SchoolClass, :count).by(-1)
      end

      context '申請の後にクラスへ生徒が所属した場合' do
        before do
          create(:user, :student, high_school: high_school, grade: grade, school_class: target_school_class)
        end

        it '422と理由のメッセージが返る' do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => approver_cookie)

          expect(response).to have_http_status(:unprocessable_content)
          expect(response.parsed_body['errors']).to eq(['対象クラスに生徒が所属しているため承認できません'])
        end

        it 'クラスは削除されず、申請も承認待ちのまま' do
          expect do
            patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                  params: request_params.to_json,
                  headers: headers.merge('Cookie' => approver_cookie)
          end.not_to change(SchoolClass, :count)

          expect(school_class_request.reload.status).to eq('pending')
        end
      end
    end

    context '却下する場合' do
      let(:status) { 'rejected' }

      it '200が返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        expect(response).to have_http_status(:ok)
      end

      it '申請が却下済みになる' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        expect(school_class_request.reload.status).to eq('rejected')
      end

      it 'approved_atが保存されない' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        expect(school_class_request.reload.approved_at).to be_nil
      end

      it '学級が作成されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => approver_cookie)
        end.not_to change(SchoolClass, :count)
      end

      it '却下メッセージが返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        json = response.parsed_body

        expect(json['message']).to eq('申請が却下されました')
      end
    end

    context 'statusにcancelledを指定した場合' do
      let(:status) { 'cancelled' }

      it '422が返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end

      it '申請が更新されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => approver_cookie)
        end.not_to(change { school_class_request.reload.status })
      end
    end

    context 'statusにpendingを指定した場合' do
      let(:status) { 'pending' }

      it '422が返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context 'lock_versionを指定しない場合' do
      let(:request_params) { { school_class_request: { status: 'approved' } } }

      it '422が返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end

      it 'エラーメッセージが返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        expect(response.parsed_body['errors']).to include('lock_versionは必須です')
      end

      it '申請が更新されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => approver_cookie)
        end.not_to(change { school_class_request.reload.status })
      end

      it '学級が作成されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => approver_cookie)
        end.not_to change(SchoolClass, :count)
      end
    end

    context '承認権限がない場合' do
      before do
        teacher.teacher_permission.update!(manage_other_teachers: false)
      end

      let(:status) { 'approved' }

      it '403が返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:forbidden)
      end

      it '申請が更新されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => cookie)
        end.not_to(change do
          school_class_request.reload.updated_at
        end)
      end
    end

    context '申請者本人が承認しようとした場合' do
      let(:status) { 'approved' }

      it '403が返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:forbidden)
      end

      it 'エラーメッセージが返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['errors']).to include('自身の申請は承認・却下できません')
      end

      it '申請が更新されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => cookie)
        end.not_to(change do
          school_class_request.reload.updated_at
        end)
      end
    end

    context '他高校の申請の場合' do
      let!(:other_high_school) { create(:high_school) }

      let!(:other_grade) do
        create(
          :grade,
          high_school: other_high_school
        )
      end

      let!(:other_teacher) do
        create(
          :user,
          :teacher,
          high_school: other_high_school
        )
      end

      let!(:other_school_class_request) do
        create(
          :school_class_request,
          applicant: other_teacher,
          grade: other_grade,
          action: :creation,
          status: :pending,
          name: '1組'
        )
      end

      let(:status) { 'approved' }

      it '404が返る' do
        patch "/api/v1/teacher/school_class_requests/#{other_school_class_request.id}",
              params: {
                school_class_request: {
                  status: status,
                  lock_version: other_school_class_request.lock_version
                }
              }.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end

      it '他高校の申請は更新されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{other_school_class_request.id}",
                params: {
                  school_class_request: {
                    status: status,
                    lock_version: other_school_class_request.lock_version
                  }
                }.to_json,
                headers: headers.merge('Cookie' => cookie)
        end.not_to(change do
          other_school_class_request.reload.status
        end)
      end
    end

    shared_examples '処理済みの申請として409を返す' do
      it '409が返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        expect(response).to have_http_status(:conflict)
      end

      it '処理済みであることを示すエラーメッセージが返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        expect(response.parsed_body['errors']).to include('この申請はすでに処理されています。再読み込みしてください')
      end

      it '申請が更新されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => approver_cookie)
        end.not_to(change { school_class_request.reload.attributes })
      end

      it '学級が作成されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => approver_cookie)
        end.not_to change(SchoolClass, :count)
      end
    end

    context '申請がpendingではない場合(最新のlock_versionを送った場合)' do
      let(:status) { 'approved' }

      before do
        school_class_request.update!(status: :approved)
      end

      it_behaves_like '処理済みの申請として409を返す'
    end

    context '他の教員が先に処理した場合' do
      let(:status) { 'approved' }
      # 画面を開いた時点のlock_versionを送る
      let!(:request_lock_version) { school_class_request.lock_version }
      let!(:other_approver) do
        create(:user, :teacher, high_school: high_school).tap do |user|
          create(:teacher_permission, user: user, manage_other_teachers: true)
        end
      end

      before do
        Teacher::ProcessSchoolClassRequestService.new(
          user: other_approver,
          id: school_class_request.id,
          status: 'rejected',
          lock_version: request_lock_version
        ).call
      end

      it_behaves_like '処理済みの申請として409を返す'
    end

    context '申請者が先に取り消した場合' do
      let(:status) { 'approved' }
      # 画面を開いた時点のlock_versionを送る
      let!(:request_lock_version) { school_class_request.lock_version }

      before do
        Teacher::CancelSchoolClassRequestService.new(user: teacher, id: school_class_request.id).call
      end

      it_behaves_like '処理済みの申請として409を返す'
    end

    context 'lock_versionが古い場合' do
      let(:status) { 'approved' }
      let(:request_lock_version) { 0 }

      before do
        school_class_request.update_column(
          :lock_version,
          school_class_request.lock_version + 1
        )
      end

      it '409が返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        expect(response).to have_http_status(:conflict)
      end

      it 'エラーメッセージが返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => approver_cookie)

        json = response.parsed_body

        expect(json['errors']).to include(
          '他のユーザーによってデータが更新されています。再読み込みしてください'
        )
      end

      it '申請が更新されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => approver_cookie)
        end.not_to(change do
          school_class_request.reload.status
        end)
      end

      it '学級が作成されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => approver_cookie)
        end.not_to change(SchoolClass, :count)
      end
    end

    context '未認証の場合' do
      let(:status) { 'approved' }

      it 'アクセスできない' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers

        expect(response).not_to have_http_status(:ok)
      end
    end

    context '存在しない申請の場合' do
      let(:status) { 'approved' }

      it '404が返る' do
        patch '/api/v1/teacher/school_class_requests/999999',
              params: {
                school_class_request: {
                  status: status,
                  lock_version: 0
                }
              }.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'DELETE /api/v1/teacher/school_class_requests/:id' do
    let!(:school_class_request) do
      create(
        :school_class_request,
        applicant: teacher,
        grade: grade,
        action: :creation,
        status: :pending,
        name: '1組'
      )
    end

    context '申請者本人が取り消す場合' do
      it '200が返る' do
        delete "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
               headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '申請が取り消し済みになる' do
        delete "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
               headers: headers.merge('Cookie' => cookie)

        expect(school_class_request.reload.status).to eq('cancelled')
      end

      it 'cancelled_atが保存される' do
        delete "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
               headers: headers.merge('Cookie' => cookie)

        expect(school_class_request.reload.cancelled_at).to be_present
      end

      it '取り消しメッセージが返る' do
        delete "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
               headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['message']).to eq('申請を取り消しました')
      end

      it '学級が作成されない' do
        expect do
          delete "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                 headers: headers.merge('Cookie' => cookie)
        end.not_to change(SchoolClass, :count)
      end
    end

    context '申請がpendingではない場合' do
      before do
        school_class_request.update!(status: :approved)
      end

      it '422が返る' do
        delete "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
               headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end

      it '申請が更新されない' do
        expect do
          delete "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                 headers: headers.merge('Cookie' => cookie)
        end.not_to(change { school_class_request.reload.updated_at })
      end
    end

    context '申請者本人以外が取り消そうとした場合' do
      let!(:other_teacher) { create(:user, :teacher, high_school: high_school) }
      let(:other_cookie) { login_and_get_cookie(other_teacher) }

      it '404が返る' do
        delete "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
               headers: headers.merge('Cookie' => other_cookie)

        expect(response).to have_http_status(:not_found)
      end

      it '申請が更新されない' do
        expect do
          delete "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                 headers: headers.merge('Cookie' => other_cookie)
        end.not_to(change { school_class_request.reload.status })
      end
    end

    context '未認証の場合' do
      it 'アクセスできない' do
        delete "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
               headers: headers

        expect(response).not_to have_http_status(:ok)
      end
    end

    context '存在しない申請の場合' do
      it '404が返る' do
        delete '/api/v1/teacher/school_class_requests/999999',
               headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
