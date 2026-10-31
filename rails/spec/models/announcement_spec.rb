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

    let(:grade) { create(:grade, high_school: school) }
    let(:other_grade) { create(:grade, high_school: school) }

    let(:user) { create(:user, user_role: role, high_school: school, grade: grade) }
    let(:other_user) { create(:user, user_role: role, high_school: school, grade: grade) }

    # 配信先は Common::BuildAnnouncementTargetAttributesService が保存する形に合わせて作る
    def create_announcement_with_targets(*targets, **announcement_attributes)
      create(:announcement, **announcement_attributes).tap do |announcement|
        targets.each { |target| create(:announcement_target, announcement: announcement, **target) }
      end
    end

    context 'target_typeがall_usersのとき' do
      let!(:all_schools_announcement) { create_announcement_with_targets({ target_type: :all_users }) }
      let!(:own_school_announcement) do
        create_announcement_with_targets({ target_type: :all_users, high_school_id: school.id })
      end

      before do
        create_announcement_with_targets({ target_type: :all_users, high_school_id: other_school.id })
      end

      it '全校向けと自校向けのお知らせを返し、他校向けは返さない' do
        expect(described_class.for_user(user)).to contain_exactly(all_schools_announcement, own_school_announcement)
      end
    end

    context 'target_typeがby_roleのとき' do
      let!(:role_announcement) { create_announcement_with_targets({ target_type: :by_role, user_role_id: role.id }) }
      let!(:own_school_role_announcement) do
        create_announcement_with_targets({ target_type: :by_role, user_role_id: role.id, high_school_id: school.id })
      end

      before do
        create_announcement_with_targets({ target_type: :by_role, user_role_id: other_role.id })
        create_announcement_with_targets(
          { target_type: :by_role, user_role_id: role.id, high_school_id: other_school.id }
        )
      end

      it '役職が一致するお知らせ(全校向け・自校向け)を返し、役職違い・他校向けは返さない' do
        expect(described_class.for_user(user)).to contain_exactly(role_announcement, own_school_role_announcement)
      end
    end

    context 'target_typeがby_gradeのとき' do
      let!(:grade_announcement) { create_announcement_with_targets({ target_type: :by_grade, grade_id: grade.id }) }
      let!(:grade_and_role_announcement) do
        create_announcement_with_targets({ target_type: :by_grade, grade_id: grade.id, user_role_id: role.id })
      end

      before do
        create_announcement_with_targets({ target_type: :by_grade, grade_id: grade.id, user_role_id: other_role.id })
        create_announcement_with_targets({ target_type: :by_grade, grade_id: other_grade.id })
      end

      it '学年が一致し役職が未指定または一致するお知らせを返し、役職違い・他学年は返さない' do
        expect(described_class.for_user(user)).to contain_exactly(grade_announcement, grade_and_role_announcement)
      end
    end

    context 'target_typeがby_schoolのとき' do
      let!(:school_announcement) do
        create_announcement_with_targets({ target_type: :by_school, high_school_id: school.id })
      end

      before do
        create_announcement_with_targets({ target_type: :by_school, high_school_id: other_school.id })
      end

      it '自校のお知らせを返し、他校は返さない' do
        expect(described_class.for_user(user)).to contain_exactly(school_announcement)
      end
    end

    context 'target_typeがby_userのとき' do
      let!(:user_announcement) { create_announcement_with_targets({ target_type: :by_user, user_id: user.id }) }

      before do
        create_announcement_with_targets({ target_type: :by_user, user_id: other_user.id })
      end

      it '本人宛てのお知らせを返し、他人宛ては返さない' do
        expect(described_class.for_user(user)).to contain_exactly(user_announcement)
      end
    end

    context '1件のお知らせに一致しない配信先と一致する配信先があるとき' do
      let!(:announcement) do
        create_announcement_with_targets(
          { target_type: :by_role, user_role_id: other_role.id },
          { target_type: :by_user, user_id: user.id }
        )
      end

      it 'そのお知らせを返す' do
        expect(described_class.for_user(user)).to contain_exactly(announcement)
      end
    end

    context '1件のお知らせに一致する配信先が複数あるとき' do
      let!(:announcement) do
        create_announcement_with_targets(
          { target_type: :by_school, high_school_id: school.id },
          { target_type: :by_user, user_id: user.id }
        )
      end

      it 'そのお知らせを1件だけ返す' do
        expect(described_class.for_user(user).to_a).to eq [announcement]
      end
    end

    context '他のスコープ・クエリメソッドと組み合わせるとき' do
      let!(:old_announcement) do
        create_announcement_with_targets(
          { target_type: :by_user, user_id: user.id },
          { target_type: :by_school, high_school_id: school.id },
          status: :published, published_at: 2.days.ago
        )
      end
      let!(:new_announcement) do
        create_announcement_with_targets(
          { target_type: :by_school, high_school_id: school.id },
          status: :published, published_at: 1.day.ago
        )
      end
      let!(:draft_announcement) do
        create_announcement_with_targets({ target_type: :by_school, high_school_id: school.id })
      end
      let!(:other_school_announcement) do
        create_announcement_with_targets(
          { target_type: :by_school, high_school_id: other_school.id },
          status: :published, published_at: 1.hour.ago
        )
      end

      it 'published・order・limitで公開済みの新しい順に絞り込める' do
        result = described_class.for_user(user).published.order(published_at: :desc).limit(2)

        expect(result.to_a).to eq [new_announcement, old_announcement]
      end

      it 'countで重複なく件数を数えられる' do
        expect(described_class.for_user(user).count).to eq 3
      end

      it 'findで対象のお知らせを取得でき、対象外は見つからない' do
        expect(described_class.for_user(user).find(old_announcement.id)).to eq old_announcement
        expect { described_class.for_user(user).find(other_school_announcement.id) }
          .to raise_error(ActiveRecord::RecordNotFound)
      end
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
      let(:announcement) { create(:announcement, status: :draft) }

      it 'trueを返す' do
        expect(announcement.editable?).to be true
      end
    end

    context 'scheduled状態の場合' do
      let(:announcement) { create(:announcement, :scheduled) }

      it 'trueを返す' do
        expect(announcement.editable?).to be true
      end
    end

    context 'published状態の場合' do
      let(:announcement) { create(:announcement, status: :published) }

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
