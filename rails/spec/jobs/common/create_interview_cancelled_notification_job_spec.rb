# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Common::CreateInterviewCancelledNotificationJob do
  let!(:interview_request) { create(:interview_request, :initiated_by_teacher, status: :cancelled) }

  describe '#perform' do
    it 'Common::CreateInterviewCancelledNotificationServiceが呼ばれる' do
      service = instance_double(Common::CreateInterviewCancelledNotificationService, call: true)

      allow(Common::CreateInterviewCancelledNotificationService)
        .to receive(:new)
        .with(interview_request: interview_request)
        .and_return(service)

      described_class.new.perform(interview_request_id: interview_request.id)

      expect(service).to have_received(:call)
    end
  end
end
