# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AnnouncementsQuery do
  let(:admin) { create(:user, :admin, high_school: nil) }
  let(:teacher) { create(:user, :teacher) }

  describe '#result (デフォルトスコープ)' do
    let!(:admin_announcement) { create(:announcement, publisher: admin) }
    let!(:teacher_announcement) { create(:announcement, publisher: teacher) }

    it '管理者が作成したお知らせのみを含む' do
      result = described_class.new.result

      expect(result).to include(admin_announcement)
      expect(result).not_to include(teacher_announcement)
    end

    context '論理削除済みの管理者が作成したお知らせがある場合' do
      let!(:deleted_admin) { create(:user, :admin, high_school: nil, deleted_at: 1.day.ago) }
      let!(:deleted_admin_announcement) { create(:announcement, publisher: deleted_admin) }

      it '含まれない' do
        result = described_class.new.result

        expect(result).not_to include(deleted_admin_announcement)
      end
    end
  end

  describe '#search' do
    let!(:matched) { create(:announcement, publisher: admin, title: 'システムメンテナンスのお知らせ') }
    let!(:not_matched) { create(:announcement, publisher: admin, title: '新機能リリースのお知らせ') }

    it 'titleが部分一致するものだけ返す' do
      result = described_class.new.search('メンテナンス').result

      expect(result).to include(matched)
      expect(result).not_to include(not_matched)
    end

    it 'キーワードが空の場合は絞り込まない' do
      result = described_class.new.search('').result

      expect(result).to include(matched, not_matched)
    end

    it 'キーワードがnilの場合は絞り込まない' do
      result = described_class.new.search(nil).result

      expect(result).to include(matched, not_matched)
    end

    it 'SQLの特殊文字を含んでいてもエラーにならない' do
      expect { described_class.new.search('%_\\').result.to_a }.not_to raise_error
    end

    it 'keywordが配列の場合でもエラーにならない' do
      expect { described_class.new.search(%w[foo bar]).result.to_a }.not_to raise_error
    end
  end

  describe '#filter_by_status' do
    let!(:draft_announcement) { create(:announcement, publisher: admin, status: :draft) }
    let!(:published_announcement) { create(:announcement, publisher: admin, status: :published) }

    it '指定したstatusのみ返す' do
      result = described_class.new.filter_by_status('draft').result

      expect(result).to include(draft_announcement)
      expect(result).not_to include(published_announcement)
    end

    it 'statusが空の場合は絞り込まない' do
      result = described_class.new.filter_by_status('').result

      expect(result).to include(draft_announcement, published_announcement)
    end

    it '不正なstatusの場合は絞り込まない' do
      result = described_class.new.filter_by_status('invalid').result

      expect(result).to include(draft_announcement, published_announcement)
    end
  end

  describe '#order_default' do
    it 'created_atの降順、同一時刻はidの降順で返す' do
      older = create(:announcement, publisher: admin)
      newer = create(:announcement, publisher: admin)
      newer.update!(created_at: older.created_at)

      result = described_class.new.order_default.result

      expect(result.to_a).to eq([newer, older])
    end
  end
end
