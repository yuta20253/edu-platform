# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Common::CancelInterviewRequestService do
  include ActiveJob::TestHelper

  subject(:service) do
    described_class.new(interview_request: interview_request, cancelled_by: cancelled_by, reason: reason)
  end

  let!(:interview_request) { create(:interview_request, :initiated_by_teacher, status: :requested) }
  let(:cancelled_by) { interview_request.student }
  let(:reason) { '部活動と重なってしまうため' }

  describe '#call' do
    context 'active(requested/scheduling/confirmed)な場合' do
      it 'trueを返す' do
        expect(service.call).to be true
      end

      it 'cancelledに更新される' do
        service.call
        interview_request.reload

        expect(interview_request.status).to eq('cancelled')
        expect(interview_request.cancelled_by).to eq(cancelled_by)
        expect(interview_request.cancel_reason).to eq(reason)
        expect(interview_request.cancelled_at).to be_present
      end

      it 'キャンセル通知ジョブがキューに積まれる' do
        expect { service.call }.to have_enqueued_job(Common::CreateInterviewCancelledNotificationJob)
          .with(interview_request_id: interview_request.id)
      end
    end

    context 'completedの場合' do
      let!(:interview_request) { create(:interview_request, :initiated_by_teacher, status: :completed) }

      it 'falseを返す' do
        expect(service.call).to be false
      end

      it '更新されない' do
        expect { service.call }.not_to(change { interview_request.reload.status })
      end
    end

    context 'すでにcancelledの場合' do
      let!(:interview_request) { create(:interview_request, :initiated_by_teacher, status: :cancelled) }

      it 'falseを返す' do
        expect(service.call).to be false
      end
    end

    context '古いlock_versionが渡された場合' do
      subject(:service) do
        described_class.new(
          interview_request: interview_request, cancelled_by: cancelled_by, reason: reason,
          lock_version: interview_request.lock_version - 1
        )
      end

      it 'StaleObjectErrorが発生する' do
        expect { service.call }.to raise_error(ActiveRecord::StaleObjectError)
      end

      it '更新されない' do
        begin
          service.call
        rescue ActiveRecord::StaleObjectError
          nil
        end

        expect(interview_request.reload.status).to eq('requested')
      end
    end

    context '現在のlock_versionが渡された場合' do
      subject(:service) do
        described_class.new(
          interview_request: interview_request, cancelled_by: cancelled_by, reason: reason,
          lock_version: interview_request.lock_version
        )
      end

      it 'trueを返す' do
        expect(service.call).to be true
      end

      it 'lock_versionがインクリメントされる' do
        expect { service.call }.to change { interview_request.reload.lock_version }.by(1)
      end
    end
  end
end
