# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'エラー応答の日本語化', type: :request do
  let(:headers) { { 'Content-Type' => 'application/json', 'Accept' => 'application/json' } }

  describe '未認証' do
    it '日本語のerrors配列で401を返す' do
      get '/api/v1/me', headers: headers

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body).to eq('errors' => ['ログインしてください'])
    end
  end

  describe '必須パラメータの欠落' do
    it '新規登録に空ボディを送ると400を返す' do
      post '/api/v1/student/signup', params: {}.to_json, headers: headers

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['errors']).to eq(['必須パラメータ「user」がありません'])
    end
  end

  describe 'バリデーションメッセージ' do
    it '範囲外の解答時間が日本語になる' do
      form = Student::CreateQuestionHistoryForm.new(current_user: build(:user), time_spent_sec: 99_999)
      form.valid?

      expect(form.errors.full_messages.join).not_to include('Translation missing')
      expect(form.errors.full_messages.join).to include('解答時間 は3600以下の値にしてください')
    end

    it 'プロフィールの項目名が日本語になる' do
      form = ProfileUpdateForm.new(name: '')
      form.valid?

      expect(form.errors.full_messages).to include('氏名 を入力してください')
    end

    it 'belongs_to の必須エラーの項目名が日本語になる' do
      task = Task.new
      task.valid?

      expect(task.errors.full_messages.join).not_to match(/Translation missing|\bUser\b|\bGoal\b/)
    end
  end
end
