# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::Analytics::SubjectProgress do
  describe '#call' do
    subject(:result) { described_class.new(user, from: Date.new(2026, 9, 5), to: Date.new(2026, 9, 11)).call }

    let(:user) { create(:user) }
    let(:task) { create(:task, user: user) }

    # 教科はidの小さい順(英語 → 数学 → 国語)に作る
    let!(:english) { create(:subject, name: '英語') }
    let!(:math) { create(:subject, name: '数学') }
    let!(:japanese) { create(:subject, name: '国語') }

    let(:english_grammar) { create(:course, subject: english, level_name: '英文法', level_number: 1) }
    let(:english_reading) { create(:course, subject: english, level_name: '英読解', level_number: 1) }
    let(:math_course) { create(:course, subject: math, level_name: '数学Ⅰ', level_number: 1) }
    let(:japanese_course) { create(:course, subject: japanese, level_name: '現代文', level_number: 1) }

    def answer(course, answered_at, correct:, target_user: user, **attrs)
      unit = create(:unit, course: course)
      question = create(:question, unit: unit)
      create(:question_history,
             user: target_user,
             task: target_user == user ? task : create(:task, user: target_user),
             course: course,
             unit: unit,
             question: question,
             question_choice: create(:question_choice, question: question),
             is_correct: correct,
             answered_at: Time.zone.parse(answered_at),
             **attrs)
    end

    context '期間内に複数の教科の解答がある場合' do
      before do
        # 解答の順番と教科のid順が違っても、教科のid順で返す
        answer(math_course, '2026-09-06 10:00:00', correct: true)
        answer(math_course, '2026-09-07 10:00:00', correct: false)
        # 英語は2つのコースの解答をまとめて集計する
        answer(english_grammar, '2026-09-08 10:00:00', correct: true)
        answer(english_grammar, '2026-09-09 10:00:00', correct: false)
        answer(english_reading, '2026-09-10 10:00:00', correct: true)
      end

      it '教科ごとの正答率を教科のid順に返す' do
        expect(result).to eq(
          [
            { subject_name: '英語', correct_rate: 66.7 },
            { subject_name: '数学', correct_rate: 50.0 }
          ]
        )
      end
    end

    context '期間の境界(JST)の場合' do
      before do
        # 期間内: UTCでは9/4になるが、JSTでは9/5(from当日)
        answer(english_grammar, '2026-09-05 00:30:00', correct: true)
        # 期間内: to当日の終わりぎりぎり
        answer(english_grammar, '2026-09-11 23:30:00', correct: false)
        # 期間外: fromの前日・toの翌日
        answer(english_grammar, '2026-09-04 23:30:00', correct: true)
        answer(english_grammar, '2026-09-12 00:30:00', correct: true)
      end

      it 'answered_atのJSTの日付が期間内の解答だけで集計する' do
        expect(result).to eq([{ subject_name: '英語', correct_rate: 50.0 }])
      end
    end

    context '期間内に解答がない教科がある場合' do
      before do
        answer(english_grammar, '2026-09-08 10:00:00', correct: true)
        # 国語は期間外の解答しかない
        answer(japanese_course, '2026-09-01 10:00:00', correct: true)
      end

      it 'その教科は含めない' do
        expect(result.pluck(:subject_name)).to eq(['英語'])
      end
    end

    context '集計の対象にならない解答がある場合' do
      before do
        answer(english_grammar, '2026-09-08 10:00:00', correct: true)
        # 他のユーザー
        answer(english_grammar, '2026-09-08 12:00:00', correct: false, target_user: create(:user))
        answer(math_course, '2026-09-08 12:00:00', correct: false, target_user: create(:user))
      end

      it '他のユーザーの解答は含めない' do
        expect(result).to eq([{ subject_name: '英語', correct_rate: 100.0 }])
      end
    end

    context '期間内に解答がない場合' do
      it '空の配列を返す' do
        expect(result).to eq([])
      end
    end
  end
end
