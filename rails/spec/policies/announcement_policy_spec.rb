# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AnnouncementPolicy do
  subject(:policy) { described_class.new(user, announcement) }

  let(:user) { create(:user, :admin) }

  describe '#update?' do
    context '自分が作成したdraftのお知らせの場合' do
      let(:announcement) { create(:announcement, publisher: user, status: :draft) }

      it 'trueを返す' do
        expect(policy.update?).to be true
      end
    end

    context '自分が作成したscheduledのお知らせの場合' do
      let(:announcement) { create(:announcement, :scheduled, publisher: user) }

      it 'trueを返す' do
        expect(policy.update?).to be true
      end
    end

    context '自分が作成したpublishedのお知らせの場合' do
      let(:announcement) { create(:announcement, publisher: user, status: :published) }

      it 'falseを返す' do
        expect(policy.update?).to be false
      end
    end

    context '他の管理者が作成したdraftのお知らせの場合' do
      let(:other_admin) { create(:user, :admin) }
      let(:announcement) { create(:announcement, publisher: other_admin, status: :draft) }

      it 'falseを返す' do
        expect(policy.update?).to be false
      end
    end
  end

  describe '#destroy?' do
    context '自分が作成したdraftのお知らせの場合' do
      let(:announcement) { create(:announcement, publisher: user, status: :draft) }

      it 'trueを返す' do
        expect(policy.destroy?).to be true
      end
    end

    context '自分が作成したscheduledのお知らせの場合' do
      let(:announcement) { create(:announcement, :scheduled, publisher: user) }

      it 'trueを返す' do
        expect(policy.destroy?).to be true
      end
    end

    context '自分が作成したpublishedのお知らせの場合' do
      let(:announcement) { create(:announcement, publisher: user, status: :published) }

      it 'falseを返す' do
        expect(policy.destroy?).to be false
      end
    end

    context '他の管理者が作成したdraftのお知らせの場合' do
      let(:other_admin) { create(:user, :admin) }
      let(:announcement) { create(:announcement, publisher: other_admin, status: :draft) }

      it 'falseを返す' do
        expect(policy.destroy?).to be false
      end
    end
  end
end
