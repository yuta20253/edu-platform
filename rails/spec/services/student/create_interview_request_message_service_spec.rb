# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::CreateInterviewRequestMessageService do
  subject(:service) do
    described_class.new(user: student, interview_request_id: interview_request.id, body: 'よろしくお願いします')
  end

  let!(:interview_request) { create(:interview_request, :initiated_by_teacher) }
  let(:student) { interview_request.student }

  describe '#call' do
    it 'メッセージが作成される' do
      expect { service.call }.to change(InterviewRequestMessage, :count).by(1)
    end

    context '当事者ではない生徒の場合' do
      let(:student) { create(:user, :student) }

      it 'RecordNotFoundが発生する' do
        expect { service.call }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end
