# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::IncrementTodayAnswerCountService, type: :model do
  subject(:service) { described_class.new(user: user) }

  let!(:prefecture) { create(:prefecture, name: '東京都') }
  let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }
  let!(:user) { create(:user, high_school: high_school) }

  let(:redis) { RedisConnection.client }
  let(:key) { "student:today_answer_count:#{user.id}:#{Time.current.to_date.iso8601}" }

  after { redis.del(key) }

  describe '#call' do
    it 'キーの値が1増える' do
      expect { service.call }.to change { redis.get(key).to_i }.from(0).to(1)
    end

    it '複数回呼ぶと値が加算される' do
      3.times { service.call }

      expect(redis.get(key).to_i).to eq(3)
    end

    it 'TTLが設定される' do
      service.call

      expect(redis.ttl(key)).to be_positive
    end

    context 'Redis接続エラーが発生する場合' do
      before { allow(redis).to receive(:incr).and_raise(Redis::BaseConnectionError) }

      it '例外を発生させない' do
        expect { service.call }.not_to raise_error
      end
    end
  end
end
