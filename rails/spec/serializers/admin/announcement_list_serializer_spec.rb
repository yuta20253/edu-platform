# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::AnnouncementListSerializer do
  subject(:serialized) do
    JSON.parse(ActiveModelSerializers::SerializableResource.new(announcement, serializer: described_class).to_json)
  end

  let(:publisher) { create(:user, :admin, high_school: nil, name: '配信者太郎', name_kana: 'ハイシンシャタロウ') }
  let(:announcement) do
    ann = create(:announcement, publisher: publisher, title: 'システムメンテナンスのお知らせ')
    create(:announcement_target, :all_users, announcement: ann)
    ann
  end

  it '一覧に必要なフィールドを含む' do
    expect(serialized.keys).to contain_exactly(
      'id', 'title', 'status', 'target_type', 'published_at', 'scheduled_at', 'created_at', 'publisher'
    )
  end

  it 'contentを含まない' do
    expect(serialized.keys).not_to include('content')
  end

  it 'statusを文字列で返す' do
    expect(serialized['status']).to eq('draft')
  end

  it 'target_typeがall_usersを返す' do
    expect(serialized['target_type']).to eq('all_users')
  end

  it 'publisherの名前を含む' do
    expect(serialized['publisher']['name']).to eq('配信者太郎')
    expect(serialized['publisher']['name_kana']).to eq('ハイシンシャタロウ')
  end
end
