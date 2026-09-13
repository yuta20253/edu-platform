# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Common::CreateInterviewRequestNotificationService do
  subject(:service) { described_class.new(interview_request: interview_request) }

  let!(:teacher) { create(:user, :teacher, name: '山田太郎') }
  let!(:student) { create(:user, :student, name: '佐藤花子') }

  describe '#call' do
    context '教員起点の場合' do
      let!(:interview_request) do
        create(:interview_request, :initiated_by_teacher, teacher: teacher, student: student)
      end

      it '生徒宛にアナウンスサービスが呼ばれる' do
        service_double = instance_double(Teacher::CreateSystemAnnouncementService, call: true)
        allow(Teacher::CreateSystemAnnouncementService).to receive(:new).and_return(service_double)

        service.call

        expect(Teacher::CreateSystemAnnouncementService).to have_received(:new).with(
          publisher: teacher,
          title: '面談の申請があります',
          content: '山田太郎先生から面談の申請がありました。',
          announcement_targets: [
            { 'target_type' => 'by_user', 'user_id' => student.id }
          ]
        )
        expect(service_double).to have_received(:call)
      end
    end

    context '生徒起点の場合' do
      let!(:interview_request) do
        create(:interview_request, :initiated_by_student, teacher: teacher, student: student)
      end

      it '教員宛にアナウンスサービスが呼ばれる' do
        service_double = instance_double(Teacher::CreateSystemAnnouncementService, call: true)
        allow(Teacher::CreateSystemAnnouncementService).to receive(:new).and_return(service_double)

        service.call

        expect(Teacher::CreateSystemAnnouncementService).to have_received(:new).with(
          publisher: student,
          title: '面談の申請があります',
          content: '佐藤花子さんから面談の申請がありました。',
          announcement_targets: [
            { 'target_type' => 'by_user', 'user_id' => teacher.id }
          ]
        )
      end
    end
  end
end
