# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::CancelInterviewRequestService do
  subject(:service) { described_class.new(user: teacher, id: interview_request.id, reason: 'やむを得ない事情のため') }

  let!(:interview_request) { create(:interview_request, :initiated_by_teacher, status: :requested) }
  let(:teacher) { interview_request.teacher }

  describe '#call' do
    it 'キャンセルされる' do
      expect(service.call).to be true
      expect(interview_request.reload.status).to eq('cancelled')
    end

    context '担当ではない教員の場合' do
      let(:teacher) { create(:user, :teacher) }

      it 'RecordNotFoundが発生する' do
        expect { service.call }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end
