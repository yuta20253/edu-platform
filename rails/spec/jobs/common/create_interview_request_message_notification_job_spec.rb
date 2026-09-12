# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Common::CreateInterviewRequestMessageNotificationJob do
  let!(:interview_request) { create(:interview_request, :initiated_by_teacher) }
  let!(:message) do
    create(:interview_request_message, interview_request: interview_request, sender: interview_request.teacher)
  end

  describe '#perform' do
    it 'Common::CreateInterviewRequestMessageNotificationServiceが呼ばれる' do
      service = instance_double(Common::CreateInterviewRequestMessageNotificationService, call: true)

      allow(Common::CreateInterviewRequestMessageNotificationService)
        .to receive(:new)
        .with(message: message)
        .and_return(service)

      described_class.new.perform(interview_request_message_id: message.id)

      expect(service).to have_received(:call)
    end
  end
end
