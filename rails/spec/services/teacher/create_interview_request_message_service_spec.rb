# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::CreateInterviewRequestMessageService do
  subject(:service) do
    described_class.new(user: teacher, interview_request_id: interview_request.id, body: 'よろしくお願いします')
  end

  let!(:interview_request) { create(:interview_request, :initiated_by_teacher) }
  let(:teacher) { interview_request.teacher }

  describe '#call' do
    it 'メッセージが作成される' do
      expect { service.call }.to change(InterviewRequestMessage, :count).by(1)
    end

    context '担当ではない教員の場合' do
      let(:teacher) { create(:user, :teacher) }

      it 'RecordNotFoundが発生する' do
        expect { service.call }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end
