# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AnnouncementPolicy do
  subject(:policy) { described_class.new(user, announcement) }

  let(:user) { create(:user, :admin) }

  shared_examples 'ownerのみ許可するアクション' do |method|
    context '自分が作成したdraftのお知らせの場合' do
      let(:announcement) { create(:announcement, publisher: user, status: :draft) }

      it 'trueを返す' do
        expect(policy.public_send(method)).to be true
      end
    end

    context '自分が作成したscheduledのお知らせの場合' do
      let(:announcement) { create(:announcement, :scheduled, publisher: user) }

      it 'trueを返す' do
        expect(policy.public_send(method)).to be true
      end
    end

    context '自分が作成したpublishedのお知らせの場合' do
      let(:announcement) { create(:announcement, publisher: user, status: :published) }

      it 'trueを返す' do
        expect(policy.public_send(method)).to be true
      end
    end

    context '他の管理者が作成したdraftのお知らせの場合' do
      let(:other_admin) { create(:user, :admin) }
      let(:announcement) { create(:announcement, publisher: other_admin, status: :draft) }

      it 'falseを返す' do
        expect(policy.public_send(method)).to be false
      end
    end

    context '発行者(他の管理者)が無効化されている場合' do
      let(:deactivated_admin) { create(:user, :admin, deleted_at: 1.day.ago) }
      let(:announcement) { create(:announcement, publisher: deactivated_admin, status: :draft) }

      it 'trueを返す' do
        expect(policy.public_send(method)).to be true
      end
    end
  end

  describe '#update?' do
    it_behaves_like 'ownerのみ許可するアクション', :update?
  end

  describe '#destroy?' do
    it_behaves_like 'ownerのみ許可するアクション', :destroy?
  end

  describe '#publish?' do
    it_behaves_like 'ownerのみ許可するアクション', :publish?
  end
end
