# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::TodayAnswerCountQuery, type: :model do
  subject(:query) { described_class.new(user: user) }

  let!(:prefecture) { create(:prefecture, name: '東京都') }
  let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }
  let!(:user) { create(:user, high_school: high_school) }

  let(:redis) { RedisConnection.client }
  let(:key) { "student:today_answer_count:#{user.id}:#{Time.current.to_date.iso8601}" }

  after { redis.del(key) }

  describe '#fetch' do
    context '本日まだ回答していない場合' do
      it '0を返す' do
        expect(query.fetch).to eq(0)
      end
    end

    context '本日すでに回答している場合' do
      before { 2.times { Student::IncrementTodayAnswerCountService.new(user: user).call } }

      it '回答数を返す' do
        expect(query.fetch).to eq(2)
      end
    end

    context 'Redis接続エラーが発生する場合' do
      before { allow(redis).to receive(:get).and_raise(Redis::BaseConnectionError) }

      it '0を返す' do
        expect(query.fetch).to eq(0)
      end
    end
  end
end
