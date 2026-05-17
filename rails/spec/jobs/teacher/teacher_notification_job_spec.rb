# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::TeacherNotificationJob, type: :job do
  let(:teacher_role) { create(:user_role, name: :teacher) }
  let(:high_school) { create(:high_school) }

  let(:sender) do
    create(:user, user_role: teacher_role, high_school: high_school)
  end

  let(:receiver) do
    create(
      :user,
      user_role: teacher_role,
      high_school: high_school,
      email: 'teacher@example.com'
    )
  end

  let(:teacher_ids) { [receiver.id] }

  describe '#perform' do
    context '正常系' do
      it 'メール送信とTeacherNotification作成が行われること' do
        mailer = instance_double(ActionMailer::MessageDelivery)

        allow(AuthMailer)
          .to receive(:invite_teacher)
          .and_return(mailer)

        allow(mailer)
          .to receive(:deliver_now)

        expect do
          described_class.perform_now(
            sender_user_id: sender.id,
            teacher_ids: teacher_ids
          )
        end.to change(TeacherNotification, :count).by(1)

        notification = TeacherNotification.last

        expect(notification.sender_user_id).to eq(sender.id)
        expect(notification.receiver_user_id).to eq(receiver.id)
        expect(notification.email).to eq(receiver.email)
        expect(notification.status).to eq('sent')

        expect(AuthMailer).to have_received(:invite_teacher).with(receiver, anything)
        expect(mailer).to have_received(:deliver_now)
      end
    end

    context 'メール送信で例外が起きた場合' do
      it 'failedとして記録されること' do
        mailer = instance_double(ActionMailer::MessageDelivery)

        allow(AuthMailer)
          .to receive(:invite_teacher)
          .and_return(mailer)

        allow(mailer)
          .to receive(:deliver_now)
          .and_raise(StandardError.new('メール失敗'))

        expect do
          described_class.perform_now(
            sender_user_id: sender.id,
            teacher_ids: teacher_ids
          )
        end.to change(TeacherNotification, :count).by(1)

        notification = TeacherNotification.last

        expect(notification.status).to eq('failed')
      end
    end

    context 'teacher_idsが空の場合' do
      it '何も作られないこと' do
        expect do
          described_class.perform_now(
            sender_user_id: sender.id,
            teacher_ids: []
          )
        end.not_to change(TeacherNotification, :count)
      end
    end
  end
end
