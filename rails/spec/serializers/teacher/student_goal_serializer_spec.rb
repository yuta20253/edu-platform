# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::StudentGoalSerializer do
  subject(:serialized) { JSON.parse(serialize(goal)) }

  let!(:user) { create(:user) }
  let!(:goal_record) do
    create(:goal, user: user, title: '数学の基礎を固める', description: '二次関数まで終える',
                  status: :in_progress, due_date: Date.new(2026, 12, 31))
  end

  # Controllerと同じく、tasksを読み込み済みの目標を渡す
  let(:goal) { GoalsQuery.new(Goal.where(id: goal_record.id)).includes_tasks.result.first }

  def serialize(target)
    ActiveModelSerializers::SerializableResource.new(target, serializer: described_class).to_json
  end

  it '一覧に必要なフィールドを含む' do
    expect(serialized.keys).to contain_exactly(
      'id', 'title', 'description', 'status', 'due_date', 'progress', 'tasks'
    )
  end

  it '目標の基本項目を返す(statusは文字列)' do
    expect(serialized).to include(
      'id' => goal_record.id, 'title' => '数学の基礎を固める',
      'description' => '二次関数まで終える', 'status' => 'in_progress'
    )
  end

  it 'due_dateをYYYY/MM/DD形式で返す' do
    expect(serialized['due_date']).to eq('2026/12/31')
  end

  context 'due_dateが未設定の場合' do
    before { goal_record.update!(due_date: nil) }

    it 'due_dateをnullで返す' do
      expect(serialized['due_date']).to be_nil
    end
  end

  context 'タスクがある場合' do
    let!(:completed_task_one) { create(:task, :completed, user: user, goal: goal_record) }
    let!(:completed_task_two) { create(:task, :completed, user: user, goal: goal_record) }
    let!(:not_started_task) do
      create(:task, user: user, goal: goal_record, title: '問題集を解く', due_date: Date.new(2026, 11, 30))
    end

    it 'タスクの完了数・総数・完了率をprogressとして返す' do
      expect(serialized['progress']).to eq(
        'task_completed_count' => 2, 'task_total_count' => 3, 'completion_rate' => 66.7
      )
    end

    it '論理削除されたタスクは数えない' do
      create(:task, :completed, user: user, goal: goal_record, deleted_at: Time.current)

      expect(serialized['progress']).to include('task_completed_count' => 2, 'task_total_count' => 3)
    end

    it 'tasksの各要素にid・title・status・due_dateだけを返す' do
      task_json = serialized['tasks'].find { |task| task['id'] == not_started_task.id }

      expect(serialized['tasks'].size).to eq(3)
      expect(task_json).to eq(
        'id' => not_started_task.id, 'title' => '問題集を解く', 'status' => 'not_started', 'due_date' => '2026/11/30'
      )
    end

    it '期限が未設定のタスクはdue_dateをnullで返す' do
      not_started_task.update!(due_date: nil)
      task_json = serialized['tasks'].find { |task| task['id'] == not_started_task.id }

      expect(task_json['due_date']).to be_nil
    end

    it 'tasksが読み込み済みなら、シリアライズ中にクエリを発行しない' do
      preloaded_goal = goal

      expect(capture_queries { serialize(preloaded_goal) }.size).to eq(0)
    end
  end

  context 'タスクが1つもない場合' do
    it '完了率は0で返す' do
      expect(serialized['progress']).to eq(
        'task_completed_count' => 0, 'task_total_count' => 0, 'completion_rate' => 0
      )
    end

    it 'tasksは空配列で返す' do
      expect(serialized['tasks']).to eq([])
    end
  end
end
