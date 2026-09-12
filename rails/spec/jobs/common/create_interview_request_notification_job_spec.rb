# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Common::CreateInterviewRequestNotificationJob do
  let!(:interview_request) { create(:interview_request, :initiated_by_teacher) }

  describe '#perform' do
    it 'Common::CreateInterviewRequestNotificationServiceが呼ばれる' do
      service = instance_double(Common::CreateInterviewRequestNotificationService, call: true)

      allow(Common::CreateInterviewRequestNotificationService)
        .to receive(:new)
        .with(interview_request: interview_request)
        .and_return(service)

      described_class.new.perform(interview_request_id: interview_request.id)

      expect(service).to have_received(:call)
    end
  end
end
