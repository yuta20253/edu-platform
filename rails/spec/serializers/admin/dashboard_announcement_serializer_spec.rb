# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::DashboardAnnouncementSerializer do
  subject(:serialized) do
    JSON.parse(ActiveModelSerializers::SerializableResource.new(announcement, serializer: described_class).to_json)
  end

  let(:publisher) { create(:user, :admin, high_school: nil) }
  let(:announcement) do
    create(:announcement, publisher: publisher, title: '冬期講習のお知らせ', content: '本文', status: :published)
  end

  it 'ダッシュボードのカード表示に必要なフィールドだけを含む' do
    expect(serialized.keys).to contain_exactly(
      'id', 'title', 'status', 'published_at', 'scheduled_at', 'created_at'
    )
  end

  it 'タイトルを返す' do
    expect(serialized['title']).to eq('冬期講習のお知らせ')
  end

  it 'ステータスを文字列で返す' do
    expect(serialized['status']).to eq('published')
  end

  it '本文を含めない' do
    expect(serialized).not_to have_key('content')
  end

  it '配信対象・配信者を含めない' do
    expect(serialized.keys).not_to include('target_type', 'publisher')
  end

  context '予約配信のお知らせの場合' do
    let(:announcement) { create(:announcement, :scheduled, publisher: publisher) }

    it 'scheduled_at を返す' do
      expect(serialized['scheduled_at']).to be_present
    end

    it 'published_at は nil を返す' do
      expect(serialized['published_at']).to be_nil
    end
  end
end
