# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::CreateSchoolClassRequestNotificationJob, type: :job do
  let!(:high_school) { create(:high_school) }
  let!(:applicant) { create(:user, :teacher, high_school: high_school, name: '山田太郎') }

  let!(:manager_teacher) { create(:user, :teacher, high_school: high_school) }
  let!(:manager_teacher_permission) do
    create(:teacher_permission, user: manager_teacher, manage_other_teachers: true)
  end

  describe '#perform' do
    it '通知サービスが呼ばれる' do
      service_double = instance_double(Teacher::CreateSchoolClassRequestNotificationService, call: true)

      allow(Teacher::CreateSchoolClassRequestNotificationService)
        .to receive(:new)
        .and_return(service_double)

      described_class.perform_now(user_id: applicant.id)

      expect(Teacher::CreateSchoolClassRequestNotificationService)
        .to have_received(:new)
        .with(user: applicant)
      expect(service_double).to have_received(:call)
    end

    it '公開済みのannouncementが作成される' do
      described_class.perform_now(user_id: applicant.id)

      expect(Announcement.last.status).to eq('published')
    end
  end
end
