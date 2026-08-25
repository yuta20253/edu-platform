# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::CreateSchoolClassRequestNotificationService do
  subject(:service) { described_class.new(user: applicant) }

  let!(:high_school) { create(:high_school) }
  let!(:applicant) { create(:user, :teacher, high_school: high_school, name: '山田太郎') }

  let!(:manager_teacher) { create(:user, :teacher, high_school: high_school) }
  let!(:manager_teacher_permission) do
    create(:teacher_permission, user: manager_teacher, manage_other_teachers: true)
  end

  let!(:non_manager_teacher) { create(:user, :teacher, high_school: high_school) }
  let!(:non_manager_teacher_permission) do
    create(:teacher_permission, user: non_manager_teacher, manage_other_teachers: false)
  end

  let!(:other_high_school) { create(:high_school) }
  let!(:other_school_manager_teacher) { create(:user, :teacher, high_school: other_high_school) }
  let!(:other_school_manager_teacher_permission) do
    create(:teacher_permission, user: other_school_manager_teacher, manage_other_teachers: true)
  end

  describe '#call' do
    it '同校でmanage_other_teachers権限を持つ教師宛にアナウンスサービスが呼ばれる' do
      service_double = instance_double(Teacher::CreateSystemAnnouncementService, call: true)

      allow(Teacher::CreateSystemAnnouncementService).to receive(:new).and_return(service_double)

      service.call

      expect(Teacher::CreateSystemAnnouncementService).to have_received(:new).with(
        publisher: applicant,
        title: 'クラス作成申請',
        content: '山田太郎先生からクラス作成申請があります。',
        announcement_targets: [
          { 'target_type' => 'by_user', 'user_id' => manager_teacher.id }
        ]
      )

      expect(service_double).to have_received(:call)
    end

    it '公開済みのannouncementが作成され、対象教師から見える' do
      service.call

      announcement = Announcement.last
      expect(announcement.status).to eq('published')
      expect(Announcement.for_user(manager_teacher).published).to include(announcement)
    end

    context '通知対象となる教師がいない場合' do
      subject(:service) { described_class.new(user: isolated_applicant) }

      let!(:isolated_high_school) { create(:high_school) }
      let!(:isolated_applicant) { create(:user, :teacher, high_school: isolated_high_school, name: '田中花子') }
      let!(:isolated_non_manager_teacher) { create(:user, :teacher, high_school: isolated_high_school) }
      let!(:isolated_non_manager_teacher_permission) do
        create(:teacher_permission, user: isolated_non_manager_teacher, manage_other_teachers: false)
      end

      it '空のannouncement_targetsでアナウンスサービスが呼ばれる' do
        service_double = instance_double(Teacher::CreateSystemAnnouncementService, call: true)

        allow(Teacher::CreateSystemAnnouncementService).to receive(:new).and_return(service_double)

        service.call

        expect(Teacher::CreateSystemAnnouncementService).to have_received(:new).with(
          publisher: isolated_applicant,
          title: 'クラス作成申請',
          content: '田中花子先生からクラス作成申請があります。',
          announcement_targets: []
        )
      end
    end
  end
end
