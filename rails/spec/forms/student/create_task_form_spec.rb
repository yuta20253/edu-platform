# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::CreateTaskForm, type: :model do
  subject { described_class.new(params) }

  let(:user) { create(:user) }
  let(:goal) { create(:goal, user:) }

  let(:params) do
    {
      current_user: user,
      goal_id: goal.id,
      title: 'タスク',
      content: '内容',
      priority: 1,
      due_date: '2026-02-10',
      memo: 'メモ'
    }
  end

  it '有効であること' do
    expect(subject).to be_valid
  end

  context '他人のgoalを指定した場合' do
    let(:other_goal) { create(:goal) }

    before do
      subject.goal_id = other_goal.id
    end

    it '無効になる' do
      expect(subject).not_to be_valid
      expect(subject.errors[:goal_id]).to include('が不正です')
    end
  end

  context 'due_dateが不正な場合' do
    before do
      subject.due_date = '2026-02-99'
    end

    it '無効になる' do
      expect(subject).not_to be_valid
      expect(subject.errors[:due_date]).to include('は正しい日付を入力してください')
    end
  end

  context 'unit_ids' do
    let!(:unit1) { create(:unit) }
    let!(:unit2) { create(:unit) }

    it '空文字やnilを除外してinteger化する' do
      subject.unit_ids = ['', unit1.id.to_s, nil, unit2.id]
      subject.valid?
      expect(subject.unit_ids).to contain_exactly(unit1.id, unit2.id)
    end
  end
end
