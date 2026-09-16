# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::CancelInterviewRequestService do
  subject(:service) { described_class.new(user: student, id: interview_request.id, reason: '部活動と重なるため') }

  let!(:interview_request) { create(:interview_request, :initiated_by_teacher, status: :requested) }
  let(:student) { interview_request.student }

  describe '#call' do
    it 'キャンセルされる' do
      expect(service.call).to be true
      expect(interview_request.reload.status).to eq('cancelled')
    end

    context '当事者ではない生徒の場合' do
      let(:student) { create(:user, :student) }

      it 'RecordNotFoundが発生する' do
        expect { service.call }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end
