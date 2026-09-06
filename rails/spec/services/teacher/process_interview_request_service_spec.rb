# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::ProcessInterviewRequestService do
  include ActiveJob::TestHelper

  subject(:service) do
    described_class.new(
      user: teacher, id: interview_request.id, status: status, lock_version: interview_request.lock_version,
      scheduled_at: scheduled_at
    )
  end

  let!(:interview_request) { create(:interview_request, :initiated_by_teacher, status: :requested) }
  let(:teacher) { interview_request.teacher }
  let(:scheduled_at) { nil }

  describe '#call' do
    context 'requestedからconfirmedにする場合(scheduled_atあり)' do
      let(:status) { 'confirmed' }
      let(:scheduled_at) { 1.week.from_now }

      it 'trueを返す' do
        expect(service.call).to be true
      end

      it 'ステータスとscheduled_atが更新される' do
        service.call
        interview_request.reload

        expect(interview_request.status).to eq('confirmed')
        expect(interview_request.scheduled_at).to be_within(1.second).of(scheduled_at)
      end

      it '確定通知ジョブがキューに積まれる' do
        expect { service.call }.to have_enqueued_job(Common::CreateInterviewConfirmedNotificationJob)
          .with(interview_request_id: interview_request.id)
      end
    end

    context 'requestedからconfirmedにする場合(scheduled_atなし)' do
      let(:status) { 'confirmed' }
      let(:scheduled_at) { nil }

      it 'falseを返す' do
        expect(service.call).to be false
      end

      it '更新されない' do
        expect { service.call }.not_to(change { interview_request.reload.status })
      end
    end

    context 'confirmedからcompletedにする場合' do
      let!(:interview_request) do
        create(:interview_request, :initiated_by_teacher, status: :confirmed, scheduled_at: 1.day.ago)
      end
      let(:status) { 'completed' }

      it 'trueを返す' do
        expect(service.call).to be true
      end

      it 'ステータスとcompleted_atが更新される' do
        service.call
        interview_request.reload

        expect(interview_request.status).to eq('completed')
        expect(interview_request.completed_at).to be_present
      end
    end

    context 'requestedからcompletedにしようとする場合' do
      let(:status) { 'completed' }

      it 'falseを返す(confirmed経由が必須)' do
        expect(service.call).to be false
      end
    end

    context 'lock_versionが指定されない場合' do
      subject(:service) do
        described_class.new(user: teacher, id: interview_request.id, status: status, scheduled_at: scheduled_at)
      end

      let(:status) { 'confirmed' }
      let(:scheduled_at) { 1.week.from_now }

      it 'ArgumentErrorにならずtrueを返す' do
        expect(service.call).to be true
      end

      it '現在のlock_versionで更新される' do
        service.call
        expect(interview_request.reload.status).to eq('confirmed')
      end
    end

    context '他の教員が担当する面談を操作しようとする場合' do
      subject(:service) do
        described_class.new(
          user: other_teacher, id: interview_request.id, status: 'confirmed',
          lock_version: interview_request.lock_version, scheduled_at: 1.week.from_now
        )
      end

      let(:other_teacher) { create(:user, :teacher) }

      it 'RecordNotFoundが発生する' do
        expect { service.call }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end
