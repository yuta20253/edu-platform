# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::AnnouncementDetailSerializer do
  subject(:serialized) do
    JSON.parse(ActiveModelSerializers::SerializableResource.new(announcement, serializer: described_class).to_json)
  end

  let(:publisher) { create(:user, :admin, high_school: nil, name: '配信者太郎', name_kana: 'ハイシンシャタロウ') }
  let(:announcement) do
    ann = create(:announcement, publisher: publisher, title: 'システムメンテナンスのお知らせ', content: 'メンテナンスを実施します。')
    create(:announcement_target, :all_users, announcement: ann)
    ann
  end

  it '詳細に必要なフィールドを含む' do
    expect(serialized.keys).to contain_exactly(
      'id', 'title', 'content', 'status', 'target_type', 'published_at', 'scheduled_at', 'created_at', 'publisher'
    )
  end

  it 'contentを含む' do
    expect(serialized['content']).to eq('メンテナンスを実施します。')
  end

  it 'target_typeがall_usersを返す' do
    expect(serialized['target_type']).to eq('all_users')
  end
end
