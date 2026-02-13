# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::CreateTaskForm, type: :model do
  subject { described_class.new(**params) }

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

  describe "#save" do
    context "入力が正しい時" do
      it "Taskが作成される" do
        expect { subject.save }.to change(Task, :count).by(1)
      end

      it "作成されたtaskのデータが与えられたパラメーターの値になっていること" do
        subject.save
        task = Task.last

        expect(task.user).to eq(user)
        expect(task.goal).to eq(goal)
        expect(task.title).to eq('タスク')
        expect(task.content).to eq('内容')
        expect(task.priority).to eq('very_low')
        expect(task.memo).to eq('メモ')
        expect(task.due_date).to eq(Date.new(2026, 2, 10))
      end

      it "unit_idsを渡した場合、task.units が付く" do
        unit1 = create(:unit)
        unit2 = create(:unit)

        form = described_class.new(
          current_user: user,
          goal_id: goal.id,
          title: "タスク",
          content: "内容",
          priority: 1,
          due_date: "2026-02-10",
          unit_ids: [unit1.id, unit2.id]
        )

        expect { form.save }.to change(Task, :count).by(1)
        task = Task.last
        expect(task.units).to match_array([unit1, unit2])
      end
    end
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
