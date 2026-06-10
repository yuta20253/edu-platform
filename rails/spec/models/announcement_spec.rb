# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Announcement, type: :model do
  describe 'enum' do
    it do
      expect(subject).to define_enum_for(:status).with_values(
        draft: 0,
        scheduled: 1,
        published: 2
      )
    end
  end

  describe '.for_user' do
    let(:role) { UserRole.find_or_create_by!(name: :teacher) }
    let(:other_role) { UserRole.find_or_create_by!(name: :student) }

    let(:school) { create(:high_school) }
    let(:other_school) { create(:high_school) }

    let(:grade) { create(:grade) }
    let(:other_grade) { create(:grade) }

    let(:user) do
      create(
        :user,
        user_role: role,
        high_school: school,
        grade: grade
      )
    end

    let!(:all_users_announcement) do
      create(:announcement).tap do |announcement|
        create(
          :announcement_target,
          announcement: announcement,
          target_type: :all_users
        )
      end
    end

    let!(:role_announcement) do
      create(:announcement).tap do |announcement|
        create(
          :announcement_target,
          announcement: announcement,
          target_type: :by_role,
          user_role_id: role.id
        )
      end
    end

    let!(:school_announcement) do
      create(:announcement).tap do |announcement|
        create(
          :announcement_target,
          announcement: announcement,
          target_type: :by_school,
          high_school_id: school.id
        )
      end
    end

    let!(:grade_announcement) do
      create(:announcement).tap do |announcement|
        create(
          :announcement_target,
          announcement: announcement,
          target_type: :by_grade,
          grade_id: grade.id
        )
      end
    end

    let!(:user_announcement) do
      create(:announcement).tap do |announcement|
        create(
          :announcement_target,
          announcement: announcement,
          target_type: :by_user,
          user_id: user.id
        )
      end
    end

    let!(:school_and_role_announcement) do
      create(:announcement).tap do |announcement|
        create(
          :announcement_target,
          announcement: announcement,
          high_school_id: school.id,
          user_role_id: role.id
        )
      end
    end

    let!(:school_role_grade_announcement) do
      create(:announcement).tap do |announcement|
        create(
          :announcement_target,
          announcement: announcement,
          high_school_id: school.id,
          user_role_id: role.id,
          grade_id: grade.id
        )
      end
    end

    let!(:not_match_role_announcement) do
      create(:announcement).tap do |announcement|
        create(
          :announcement_target,
          announcement: announcement,
          target_type: :by_role,
          user_role_id: other_role.id
        )
      end
    end

    let!(:not_match_school_announcement) do
      create(:announcement).tap do |announcement|
        create(
          :announcement_target,
          announcement: announcement,
          target_type: :by_school,
          high_school_id: other_school.id
        )
      end
    end

    let!(:not_match_grade_announcement) do
      create(:announcement).tap do |announcement|
        create(
          :announcement_target,
          announcement: announcement,
          target_type: :by_grade,
          grade_id: other_grade.id
        )
      end
    end

    let!(:school_and_other_role_announcement) do
      create(:announcement).tap do |announcement|
        create(
          :announcement_target,
          announcement: announcement,
          high_school_id: school.id,
          user_role_id: other_role.id
        )
      end
    end

    let!(:other_school_and_role_announcement) do
      create(:announcement).tap do |announcement|
        create(
          :announcement_target,
          announcement: announcement,
          high_school_id: other_school.id,
          user_role_id: role.id
        )
      end
    end

    let!(:role_and_other_grade_announcement) do
      create(:announcement).tap do |announcement|
        create(
          :announcement_target,
          announcement: announcement,
          user_role_id: role.id,
          grade_id: other_grade.id
        )
      end
    end

    it 'ユーザーに一致するお知らせのみ取得する' do
      result = described_class.for_user(user)

      expect(result).to include(
        all_users_announcement,
        role_announcement,
        school_announcement,
        grade_announcement,
        user_announcement,
        school_and_role_announcement,
        school_role_grade_announcement
      )

      expect(result).not_to include(
        not_match_role_announcement,
        not_match_school_announcement,
        not_match_grade_announcement,
        school_and_other_role_announcement,
        other_school_and_role_announcement,
        role_and_other_grade_announcement
      )
    end

    it '複数条件を持つ1レコードをAND条件として扱う' do
      result = described_class.for_user(user)

      expect(result).to include(
        school_and_role_announcement,
        school_role_grade_announcement
      )

      expect(result).not_to include(
        school_and_other_role_announcement,
        other_school_and_role_announcement,
        role_and_other_grade_announcement
      )
    end

    it '複数レコードはOR条件として扱う' do
      another_announcement = create(:announcement)

      create(
        :announcement_target,
        announcement: another_announcement,
        user_role_id: role.id
      )

      create(
        :announcement_target,
        announcement: another_announcement,
        high_school_id: other_school.id
      )

      result = described_class.for_user(user)

      expect(result).to include(another_announcement)
    end
  end
end
