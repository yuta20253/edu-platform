# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::StudentTaskSerializer do
  subject(:serialized) { JSON.parse(serialize(task)) }

  let!(:user) { create(:user) }
  let!(:goal) { create(:goal, user: user, title: '数学の基礎を固める') }
  let!(:course) { create(:course) }
  let!(:unit_one) { create(:unit, course: course) }
  let!(:unit_two) { create(:unit, course: course) }
  let!(:task_record) do
    create(:task, user: user, goal: goal, title: '二次関数の復習', priority: :high,
                  status: :in_progress, due_date: Date.new(2026, 11, 30))
  end

  # Controllerと同じく、goal・units・courseを読み込み済みのタスクを渡す
  let(:task) { TasksQuery.new(Task.where(id: task_record.id)).includes_units.result.first }

  let(:task_progress) do
    {
      task_record.id => {
        total_questions: 15, answered_count: 9, correct_count: 6, progress_rate: 60.0, correct_rate: 66.7,
        units: {
          unit_one.id => {
            total_questions: 10, answered_count: 9, correct_count: 6, progress_rate: 90.0, correct_rate: 66.7
          },
          unit_two.id => {
            total_questions: 5, answered_count: 0, correct_count: 0, progress_rate: 0, correct_rate: nil
          }
        }
      }
    }
  end

  before do
    create(:task_unit, task: task_record, unit: unit_one)
    create(:task_unit, task: task_record, unit: unit_two)
  end

  def serialize(target)
    ActiveModelSerializers::SerializableResource.new(
      target, serializer: described_class, task_progress: task_progress
    ).to_json
  end

  def count_queries(&block)
    queries = []
    callback = lambda { |_n, _s, _f, _id, payload|
      queries << payload[:sql] if payload[:name] != 'SCHEMA'
    }
    ActiveSupport::Notifications.subscribed(callback, 'sql.active_record', &block)
    queries.size
  end

  it '一覧に必要なフィールドを含む' do
    expect(serialized.keys).to contain_exactly(
      'id', 'title', 'status', 'priority', 'due_date', 'completed_at', 'goal', 'progress', 'units'
    )
  end

  it 'タスクの基本項目を返す(statusとpriorityは文字列)' do
    expect(serialized).to include(
      'id' => task_record.id, 'title' => '二次関数の復習', 'status' => 'in_progress', 'priority' => 'high'
    )
  end

  it 'due_dateをYYYY/MM/DD形式で返す' do
    expect(serialized['due_date']).to eq('2026/11/30')
  end

  context '完了していないタスクの場合' do
    it 'completed_atをnullで返す' do
      expect(serialized['completed_at']).to be_nil
    end
  end

  context '完了済みのタスクの場合' do
    before do
      task_record.update!(status: :completed, completed_at: Time.zone.local(2026, 11, 20, 10, 0))
    end

    it 'completed_atをYYYY/MM/DD形式で返す' do
      expect(serialized['completed_at']).to eq('2026/11/20')
    end
  end

  it '紐づく目標のidとtitleを返す' do
    expect(serialized['goal']).to eq('id' => goal.id, 'title' => '数学の基礎を固める')
  end

  it 'タスク単位の解答状況をprogressとして返す' do
    expect(serialized['progress']).to eq(
      'total_questions' => 15, 'answered_count' => 9, 'correct_count' => 6,
      'progress_rate' => 60.0, 'correct_rate' => 66.7
    )
  end

  it 'unitsの各要素に、そのUnitの解答状況を返す' do
    units_by_id = serialized['units'].index_by { |unit| unit['id'] }

    expect(units_by_id.keys).to contain_exactly(unit_one.id, unit_two.id)
    expect(units_by_id[unit_one.id]).to include(
      'unit_name' => unit_one.unit_name,
      'total_questions' => 10, 'answered_count' => 9, 'correct_count' => 6,
      'progress_rate' => 90.0, 'correct_rate' => 66.7
    )
    expect(units_by_id[unit_two.id]).to include(
      'unit_name' => unit_two.unit_name,
      'total_questions' => 5, 'answered_count' => 0, 'correct_count' => 0,
      'progress_rate' => 0, 'correct_rate' => nil
    )
  end

  it '関連が読み込み済みなら、シリアライズ中にクエリを発行しない' do
    preloaded_task = task

    expect(count_queries { serialize(preloaded_task) }).to eq(0)
  end
end
