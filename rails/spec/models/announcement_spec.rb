# frozen_string_literal: true

# == Schema Information
#
# Table name: announcements
#
#  id           :bigint           not null, primary key
#  title        :string(255)      not null
#  content      :text(65535)      not null
#  status       :integer          default("draft"), not null
#  published_at :datetime
#  publisher_id :bigint           not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  scheduled_at :datetime
#
require 'rails_helper'

RSpec.describe Announcement, type: :model do
  describe 'indexes' do
    it 'status と scheduled_at の複合インデックスが存在する' do
      expect(ActiveRecord::Base.connection.index_exists?(:announcements, %i[status scheduled_at]))
        .to be true
    end
  end

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

  describe '.for_high_school' do
    let(:school) { create(:high_school) }
    let(:other_school) { create(:high_school) }

    let!(:school_announcement) do
      ann = create(:announcement)
      create(:announcement_target, :by_school, announcement: ann, high_school_id: school.id)
      ann
    end

    let!(:other_school_announcement) do
      ann = create(:announcement)
      create(:announcement_target, :by_school, announcement: ann, high_school_id: other_school.id)
      ann
    end

    let!(:all_users_announcement) do
      ann = create(:announcement)
      create(:announcement_target, :all_users, announcement: ann)
      ann
    end

    it '指定した高校をターゲットにしたお知らせのみ返す' do
      result = described_class.for_high_school(school.id)

      expect(result).to contain_exactly(school_announcement)
    end

    it '全体配信(all_users)のお知らせは含まない' do
      result = described_class.for_high_school(school.id)

      expect(result).not_to include(all_users_announcement)
    end

    it '同一高校をターゲットにした行が複数あっても重複せず1件で返す' do
      create(:announcement_target, :by_school, announcement: school_announcement, high_school_id: school.id)

      result = described_class.for_high_school(school.id)

      expect(result.to_a.count { |a| a == school_announcement }).to eq(1)
    end
  end

  describe 'validations' do
    subject(:announcement) { build(:announcement, title: title, content: content) }

    context 'titleが空の場合' do
      let(:title) { '' }
      let(:content) { 'テスト内容' }

      it '無効である' do
        expect(announcement).not_to be_valid
        expect(announcement.errors[:title]).to be_present
      end
    end

    context 'titleが256文字の場合' do
      let(:title) { 'あ' * 256 }
      let(:content) { 'テスト内容' }

      it '無効である' do
        expect(announcement).not_to be_valid
        expect(announcement.errors[:title]).to be_present
      end
    end

    context 'titleが255文字の場合' do
      let(:title) { 'あ' * 255 }
      let(:content) { 'テスト内容' }

      it '有効である' do
        expect(announcement).to be_valid
      end
    end

    context 'contentが空の場合' do
      let(:title) { 'テストタイトル' }
      let(:content) { '' }

      it '無効である' do
        expect(announcement).not_to be_valid
        expect(announcement.errors[:content]).to be_present
      end
    end

    context 'contentが10001文字の場合' do
      let(:title) { 'テストタイトル' }
      let(:content) { 'あ' * 10_001 }

      it '無効である' do
        expect(announcement).not_to be_valid
        expect(announcement.errors[:content]).to be_present
      end
    end

    context 'contentが10000文字の場合' do
      let(:title) { 'テストタイトル' }
      let(:content) { 'あ' * 10_000 }

      it '有効である' do
        expect(announcement).to be_valid
      end
    end
  end

  describe '#editable?' do
    context 'draft状態の場合' do
      let(:announcement) { build(:announcement, status: :draft) }

      it 'trueを返す' do
        expect(announcement.editable?).to be true
      end
    end

    context 'scheduled状態の場合' do
      let(:announcement) { build(:announcement, :scheduled) }

      it 'trueを返す' do
        expect(announcement.editable?).to be true
      end
    end

    context 'published状態の場合' do
      let(:announcement) { build(:announcement, status: :published) }

      it 'falseを返す' do
        expect(announcement.editable?).to be false
      end
    end
  end

  describe '#destroy' do
    context 'published状態の場合' do
      let!(:announcement) { create(:announcement, status: :published) }

      it '削除に失敗する' do
        expect(announcement.destroy).to be false
      end

      it 'エラーが追加される' do
        announcement.destroy
        expect(announcement.errors[:base]).to be_present
      end

      it 'レコードが削除されない' do
        expect { announcement.destroy }.not_to change(described_class, :count)
      end
    end

    context 'draft状態の場合' do
      let!(:announcement) { create(:announcement, status: :draft) }

      it '削除に成功する' do
        expect { announcement.destroy }.to change(described_class, :count).by(-1)
      end
    end
  end

  describe '#update' do
    context 'published状態の場合' do
      let!(:announcement) { create(:announcement, status: :published, title: '旧タイトル') }

      it '更新に失敗する' do
        expect(announcement.update(title: '新タイトル')).to be false
      end

      it 'エラーが追加される' do
        announcement.update(title: '新タイトル')
        expect(announcement.errors[:base]).to be_present
      end

      it 'titleが更新されない' do
        announcement.update(title: '新タイトル')
        expect(announcement.reload.title).to eq('旧タイトル')
      end
    end

    context 'draft状態の場合' do
      let!(:announcement) { create(:announcement, status: :draft, title: '旧タイトル') }

      it '更新に成功する' do
        expect(announcement.update(title: '新タイトル')).to be true
      end
    end
  end
end
