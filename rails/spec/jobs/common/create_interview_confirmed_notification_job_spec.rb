# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Common::CreateInterviewConfirmedNotificationJob do
  let!(:interview_request) { create(:interview_request, :initiated_by_teacher, status: :confirmed) }

  describe '#perform' do
    it 'Common::CreateInterviewConfirmedNotificationServiceが呼ばれる' do
      service = instance_double(Common::CreateInterviewConfirmedNotificationService, call: true)

      allow(Common::CreateInterviewConfirmedNotificationService)
        .to receive(:new)
        .with(interview_request: interview_request)
        .and_return(service)

      described_class.new.perform(interview_request_id: interview_request.id)

      expect(service).to have_received(:call)
    end
  end
end
