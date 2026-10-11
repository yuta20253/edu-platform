# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::Analytics::StudyMinutes do
  describe '#call' do
    subject(:result) { described_class.new(user, from: from, to: to).call }

    let(:user) { create(:user) }
    let(:task) { create(:task, user: user) }

    def study_on(started_at, minutes, target_user: user, **attrs)
      create(:study_log, user: target_user, task: target_user == user ? task : create(:task, user: target_user),
                         started_at: Time.zone.parse(started_at), duration_minutes: minutes, **attrs)
    end

    context '期間が31日以内の場合' do
      let(:from) { Date.new(2026, 9, 5) }
      let(:to) { Date.new(2026, 9, 11) }

      before do
        # 同じ日の記録は合計する
        study_on('2026-09-05 08:00:00', 30)
        study_on('2026-09-05 20:00:00', 20)
        # UTCでは9/6になる時刻。JSTの日付(9/7)で集計する
        study_on('2026-09-07 00:30:00', 25)
        study_on('2026-09-08 08:00:00', 15)
        # duration_minutesがnil(学習中)は0として扱う
        study_on('2026-09-09 08:00:00', nil)
        # 期間の最終日(to)の終わりぎりぎり
        study_on('2026-09-11 23:30:00', 10)
      end

      it "unitが'day'になる" do
        expect(result[:unit]).to eq('day')
      end

      it '期間内の全日付を古い順に並べ、記録のない日は0で返す' do
        expect(result[:series]).to eq(
          [
            { date: Date.new(2026, 9, 5), minutes: 50 },
            { date: Date.new(2026, 9, 6), minutes: 0 },
            { date: Date.new(2026, 9, 7), minutes: 25 },
            { date: Date.new(2026, 9, 8), minutes: 15 },
            { date: Date.new(2026, 9, 9), minutes: 0 },
            { date: Date.new(2026, 9, 10), minutes: 0 },
            { date: Date.new(2026, 9, 11), minutes: 10 }
          ]
        )
      end

      it '期間内の合計を返す' do
        expect(result[:total]).to eq(100)
      end
    end

    context '集計の対象にならない記録がある場合' do
      let(:from) { Date.new(2026, 9, 5) }
      let(:to) { Date.new(2026, 9, 11) }

      before do
        study_on('2026-09-08 08:00:00', 15)
        # 期間外(fromの前日・toの翌日。どちらもJSTの日付で判定する)
        study_on('2026-09-04 23:30:00', 100)
        study_on('2026-09-12 00:30:00', 100)
        # 論理削除済み
        study_on('2026-09-08 09:00:00', 60, deleted_at: Time.current)
        # 他のユーザー
        study_on('2026-09-08 10:00:00', 40, target_user: create(:user))
      end

      it '期間外・論理削除済み・他のユーザーの記録は含めない' do
        expect(result[:series].find { |point| point[:date] == Date.new(2026, 9, 8) }[:minutes]).to eq(15)
        expect(result[:total]).to eq(15)
      end
    end

    context '学習記録がない場合' do
      let(:from) { Date.new(2026, 9, 5) }
      let(:to) { Date.new(2026, 9, 11) }

      it '全日付を0で返し、合計も0になる' do
        expect(result[:series].size).to eq(7)
        expect(result[:series].pluck(:minutes)).to all(eq(0))
        expect(result[:total]).to eq(0)
      end
    end

    context '期間がちょうど31日の場合' do
      let(:from) { Date.new(2026, 8, 1) }
      let(:to) { Date.new(2026, 8, 31) }

      it "unitが'day'のまま、31日分を返す" do
        expect(result[:unit]).to eq('day')
        expect(result[:series].size).to eq(31)
      end
    end

    context '期間が32日以上の場合' do
      let(:from) { Date.new(2026, 8, 1) }
      let(:to) { Date.new(2026, 9, 1) } # 32日間

      before do
        # 1つ目の区切り(8/1〜8/7)
        study_on('2026-08-01 08:00:00', 10)
        study_on('2026-08-07 23:30:00', 20)
        # 2つ目の区切り(8/8〜8/14)。UTCでは8/7になる時刻
        study_on('2026-08-08 00:30:00', 5)
        # 5つ目の区切り(8/29〜9/1、4日間)
        study_on('2026-08-29 08:00:00', 7)
        study_on('2026-09-01 08:00:00', 3)
      end

      it "unitが'week'になる" do
        expect(result[:unit]).to eq('week')
      end

      it 'fromから7日ごとに区切り、各区切りの初日をdateにする(最後の区切りは7日未満)' do
        expect(result[:series]).to eq(
          [
            { date: Date.new(2026, 8, 1), minutes: 30 },
            { date: Date.new(2026, 8, 8), minutes: 5 },
            { date: Date.new(2026, 8, 15), minutes: 0 },
            { date: Date.new(2026, 8, 22), minutes: 0 },
            { date: Date.new(2026, 8, 29), minutes: 10 }
          ]
        )
      end

      it '期間内の合計を返す' do
        expect(result[:total]).to eq(45)
      end
    end
  end
end
