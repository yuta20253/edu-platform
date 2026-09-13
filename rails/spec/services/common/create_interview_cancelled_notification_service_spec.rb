# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Common::CreateInterviewCancelledNotificationService do
  subject(:service) { described_class.new(interview_request: interview_request) }

  describe '#call' do
    context '生徒がキャンセルした場合' do
      let!(:interview_request) do
        create(
          :interview_request, :initiated_by_teacher, status: :cancelled,
                                                     cancel_reason: '部活動と重なるため'
        ).tap { |r| r.update_columns(cancelled_by_id: r.student_id) }
      end

      it '教員宛にアナウンスサービスが呼ばれる' do
        service_double = instance_double(Teacher::CreateSystemAnnouncementService, call: true)
        allow(Teacher::CreateSystemAnnouncementService).to receive(:new).and_return(service_double)

        service.call

        expect(Teacher::CreateSystemAnnouncementService).to have_received(:new).with(
          publisher: interview_request.student,
          title: '面談がキャンセルされました',
          content: '面談がキャンセルされました。理由: 部活動と重なるため',
          announcement_targets: [
            { 'target_type' => 'by_user', 'user_id' => interview_request.teacher_id }
          ]
        )
      end
    end

    context '教員がキャンセルした場合(理由なし)' do
      let!(:interview_request) do
        create(:interview_request, :initiated_by_teacher, status: :cancelled)
          .tap { |r| r.update_columns(cancelled_by_id: r.teacher_id) }
      end

      it '生徒宛に理由なしの内容でアナウンスサービスが呼ばれる' do
        service_double = instance_double(Teacher::CreateSystemAnnouncementService, call: true)
        allow(Teacher::CreateSystemAnnouncementService).to receive(:new).and_return(service_double)

        service.call

        expect(Teacher::CreateSystemAnnouncementService).to have_received(:new).with(
          publisher: interview_request.teacher,
          title: '面談がキャンセルされました',
          content: '面談がキャンセルされました。',
          announcement_targets: [
            { 'target_type' => 'by_user', 'user_id' => interview_request.student_id }
          ]
        )
      end
    end
  end
end
