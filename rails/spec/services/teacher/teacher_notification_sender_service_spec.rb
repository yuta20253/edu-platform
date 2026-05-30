# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::TeacherNotificationSenderService do
  include ActiveJob::TestHelper

  subject do
    described_class.new(
      user: user,
      teacher_ids: teacher_ids
    )
  end

  let(:teacher_role) { create(:user_role, name: :teacher) }
  let(:high_school) { create(:high_school) }

  let(:user) do
    create(
      :user,
      user_role: teacher_role,
      high_school: high_school
    )
  end

  let(:teacher1) { create(:user, user_role: teacher_role, high_school: high_school) }
  let(:teacher2) { create(:user, user_role: teacher_role, high_school: high_school) }

  let(:teacher_ids) { [teacher1.id, teacher2.id] }

  describe '#call' do
    it 'TeacherNotificationJobがenqueueされること' do
      expect do
        subject.call
      end.to have_enqueued_job(Teacher::TeacherNotificationJob)
        .with(
          sender_user_id: user.id,
          teacher_ids: teacher_ids
        )
    end
  end
end
