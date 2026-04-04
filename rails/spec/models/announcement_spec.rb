# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Announcement, type: :model do
  describe 'enum' do
    it { is_expected.to define_enum_for(:status).with_values(draft: 0, scheduled: 1, published: 2) }
  end

  describe '.for_user' do
    let(:role) { UserRole.find_or_create_by!(name: :teacher) }
    let(:other_role) { UserRole.find_or_create_by!(name: :student) }

    let(:school) { create(:high_school) }
    let(:other_school) { create(:high_school) }

    let(:grade) { create(:grade) }
    let(:other_grade) { create(:grade) }

    let(:user) do
      create(:user,
             user_role: role,
             high_school: school,
             grade: grade)
    end

    let!(:all_users_announcement) do
      create(:announcement).tap do |a|
        create(:announcement_target,
               announcement: a,
               target_type: :all_users)
      end
    end

    let!(:role_announcement) do
      create(:announcement).tap do |a|
        create(:announcement_target,
               announcement: a,
               target_type: :by_role,
               user_role_id: role.id)
      end
    end

    let!(:school_announcement) do
      create(:announcement).tap do |a|
        create(:announcement_target,
               announcement: a,
               target_type: :by_school,
               high_school_id: school.id)
      end
    end

    let!(:grade_announcement) do
      create(:announcement).tap do |a|
        create(:announcement_target,
               announcement: a,
               target_type: :by_grade,
               grade_id: grade.id)
      end
    end

    let!(:not_match_announcement) do
      create(:announcement).tap do |a|
        create(:announcement_target,
               announcement: a,
               target_type: :by_role,
               user_role_id: other_role.id)
      end
    end

    it 'ユーザーに該当するお知らせのみ取得する' do
      result = described_class.for_user(user)

      expect(result).to include(
        all_users_announcement,
        role_announcement,
        school_announcement,
        grade_announcement
      )

      expect(result).not_to include(not_match_announcement)
    end
  end

  describe '.targeting_all_users' do
    let!(:target) do
      create(:announcement).tap do |a|
        create(:announcement_target,
               announcement: a,
               target_type: :all_users)
      end
    end

    let!(:other) do
      create(:announcement).tap do |a|
        create(:announcement_target,
               announcement: a,
               target_type: :by_role,
               user_role: create(:user_role))
      end
    end

    it '全体配信のみ取得する' do
      expect(described_class.targeting_all_users).to contain_exactly(target)
    end
  end

  describe '.targeting_by_role' do
    let(:role) { create(:user_role, :teacher) }
    let(:other_role) { create(:user_role, :student) }
    let!(:match) do
      create(:announcement).tap do |a|
        create(:announcement_target,
               announcement: a,
               target_type: :by_role,
               user_role_id: role.id)
      end
    end

    let!(:not_match) do
      create(:announcement).tap do |a|
        create(:announcement_target,
               announcement: a,
               target_type: :by_role,
               user_role_id: other_role.id)
      end
    end

    it '指定したroleのみ取得する' do
      expect(described_class.targeting_by_role(role.id)).to contain_exactly(match)
    end
  end

  describe '.targeting_by_school' do
    let(:school) { create(:high_school) }
    let(:other_school) { create(:high_school) }

    let!(:match) do
      create(:announcement).tap do |a|
        create(:announcement_target,
               announcement: a,
               target_type: :by_school,
               high_school_id: school.id)
      end
    end

    let!(:not_match) do
      create(:announcement).tap do |a|
        create(:announcement_target,
               announcement: a,
               target_type: :by_school,
               high_school_id: other_school.id)
      end
    end

    it '指定したschoolのみ取得する' do
      expect(described_class.targeting_by_school(school.id)).to contain_exactly(match)
    end
  end

  describe '.targeting_by_grade' do
    let(:grade) { create(:grade) }
    let(:other_grade) { create(:grade) }

    let!(:match) do
      create(:announcement).tap do |a|
        create(:announcement_target,
               announcement: a,
               target_type: :by_grade,
               grade_id: grade.id)
      end
    end

    let!(:not_match) do
      create(:announcement).tap do |a|
        create(:announcement_target,
               announcement: a,
               target_type: :by_grade,
               grade_id: other_grade.id)
      end
    end

    it '指定したgradeのみ取得する' do
      expect(described_class.targeting_by_grade(grade.id)).to contain_exactly(match)
    end
  end
end
