# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Common::PostInterviewRequestMessageService do
  include ActiveJob::TestHelper

  subject(:service) do
    described_class.new(interview_request: interview_request, sender: sender, body: '来週の火曜16時はいかがですか?')
  end

  let!(:interview_request) { create(:interview_request, :initiated_by_teacher, status: :requested) }
  let(:sender) { interview_request.teacher }

  describe '#call' do
    it 'メッセージが作成される' do
      expect { service.call }.to change(InterviewRequestMessage, :count).by(1)
    end

    it '作成したメッセージを返す' do
      message = service.call
      expect(message.body).to eq('来週の火曜16時はいかがですか?')
      expect(message.sender).to eq(sender)
    end

    it 'requestedからschedulingへ遷移する' do
      service.call
      expect(interview_request.reload.status).to eq('scheduling')
    end

    it '通知ジョブがキューに積まれる' do
      expect { service.call }.to have_enqueued_job(Common::CreateInterviewRequestMessageNotificationJob)
    end

    context 'すでにschedulingの場合' do
      let!(:interview_request) { create(:interview_request, :initiated_by_teacher, status: :scheduling) }

      it 'ステータスは変わらない' do
        expect { service.call }.not_to(change { interview_request.reload.status })
      end
    end

    context '終了した面談の場合' do
      let!(:interview_request) { create(:interview_request, :initiated_by_teacher, status: :completed) }

      it 'RecordInvalidが発生する' do
        expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end

    context 'ステータス遷移の更新時にStaleObjectErrorが発生する場合(他の操作と競合した場合)' do
      before do
        allow(interview_request).to receive(:reload).and_return(interview_request)
        allow(interview_request).to receive(:requested?).and_return(true)
        allow(interview_request).to receive(:update!)
          .with(status: :scheduling)
          .and_raise(ActiveRecord::StaleObjectError.new(interview_request, 'update'))
      end

      it '例外が外に伝播しない' do
        expect { service.call }.not_to raise_error
      end

      it 'メッセージ作成はロールバックされない' do
        expect { service.call }.to change(InterviewRequestMessage, :count).by(1)
      end
    end
  end
end
