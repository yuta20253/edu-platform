# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::Analytics::Streak do
  describe '#call' do
    subject(:streak) { described_class.new(user).call }

    let(:user) { create(:user) }
    let(:task) { create(:task, user: user) }

    def study_on(started_at, target_user: user, **attrs)
      create(:study_log, user: target_user, task: target_user == user ? task : create(:task, user: target_user),
                         started_at: started_at, **attrs)
    end

    # 実行日と同じ日付にすると「今日」の扱いの誤りを見逃すため、実行日とずらした日付に固定する
    around do |example|
      travel_to(Time.zone.parse('2026-09-11 10:00:00')) { example.run }
    end

    context '学習記録がない場合' do
      it '0を返す' do
        expect(streak).to eq(0)
      end
    end

    context '今日から3日間連続で学習している場合' do
      before do
        study_on(Time.zone.parse('2026-09-11 08:00:00'))
        study_on(Time.zone.parse('2026-09-10 20:00:00'))
        study_on(Time.zone.parse('2026-09-09 07:00:00'))
      end

      it '3を返す' do
        expect(streak).to eq(3)
      end
    end

    context '今日はまだ学習していないが、昨日まで2日連続で学習している場合' do
      before do
        study_on(Time.zone.parse('2026-09-10 20:00:00'))
        study_on(Time.zone.parse('2026-09-09 07:00:00'))
      end

      it '昨日から数えて2を返す' do
        expect(streak).to eq(2)
      end
    end

    context '最後に学習したのが一昨日の場合' do
      before do
        study_on(Time.zone.parse('2026-09-09 07:00:00'))
        study_on(Time.zone.parse('2026-09-08 07:00:00'))
      end

      it '連続が途切れているので0を返す' do
        expect(streak).to eq(0)
      end
    end

    context '途中で1日空いている場合' do
      before do
        study_on(Time.zone.parse('2026-09-11 08:00:00'))
        study_on(Time.zone.parse('2026-09-10 08:00:00'))
        # 9/9は学習なし
        study_on(Time.zone.parse('2026-09-08 08:00:00'))
        study_on(Time.zone.parse('2026-09-07 08:00:00'))
      end

      it '空いた日の手前までの2を返す' do
        expect(streak).to eq(2)
      end
    end

    context '同じ日に複数回学習している場合' do
      before do
        study_on(Time.zone.parse('2026-09-11 08:00:00'))
        study_on(Time.zone.parse('2026-09-11 09:00:00'))
        study_on(Time.zone.parse('2026-09-10 08:00:00'))
      end

      it '1日として数える' do
        expect(streak).to eq(2)
      end
    end

    context '日付の境界(JST)の場合' do
      before do
        # どちらもUTCでは9/10になる時刻。JSTの日付で数えれば今日と昨日の2日になる
        study_on(Time.zone.parse('2026-09-11 00:30:00'))
        study_on(Time.zone.parse('2026-09-10 23:30:00'))
      end

      it 'JSTの日付で数えて2を返す' do
        expect(streak).to eq(2)
      end
    end

    context '論理削除された学習記録がある場合' do
      before do
        study_on(Time.zone.parse('2026-09-11 08:00:00'))
        study_on(Time.zone.parse('2026-09-10 08:00:00'), deleted_at: Time.current)
        study_on(Time.zone.parse('2026-09-09 08:00:00'))
      end

      it '論理削除された記録は数えない' do
        expect(streak).to eq(1)
      end
    end

    context '他のユーザーの学習記録がある場合' do
      let(:other_user) { create(:user) }

      before do
        study_on(Time.zone.parse('2026-09-11 08:00:00'))
        study_on(Time.zone.parse('2026-09-10 08:00:00'), target_user: other_user)
      end

      it '自分の記録だけで数える' do
        expect(streak).to eq(1)
      end
    end
  end
end
