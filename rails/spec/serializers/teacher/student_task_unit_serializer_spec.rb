# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::StudentTaskUnitSerializer do
  subject(:serialized) do
    JSON.parse(
      ActiveModelSerializers::SerializableResource.new(unit, serializer: described_class, progress: progress).to_json
    )
  end

  let(:course) { create(:course, level_number: 2, level_name: '標準') }
  let(:unit) { create(:unit, course: course, unit_name: '二次関数') }
  let(:progress) do
    { total_questions: 10, answered_count: 8, correct_count: 6, progress_rate: 80.0, correct_rate: 75.0 }
  end

  it 'UnitSerializerを継承している' do
    expect(described_class.superclass).to eq(UnitSerializer)
  end

  it 'UnitSerializerの項目と解答状況の項目を含む' do
    expect(serialized.keys).to contain_exactly(
      'id', 'course_id', 'unit_name', 'course',
      'total_questions', 'answered_count', 'correct_count', 'progress_rate', 'correct_rate'
    )
  end

  it 'Unitの基本項目を返す' do
    expect(serialized).to include(
      'id' => unit.id,
      'course_id' => course.id,
      'unit_name' => '二次関数',
      'course' => { 'id' => course.id, 'level_number' => 2, 'level_name' => '標準' }
    )
  end

  it '受け取った解答状況をそのまま返す' do
    expect(serialized).to include(
      'total_questions' => 10, 'answered_count' => 8, 'correct_count' => 6,
      'progress_rate' => 80.0, 'correct_rate' => 75.0
    )
  end

  context '未解答で正答率がnilの場合' do
    let(:progress) do
      { total_questions: 10, answered_count: 0, correct_count: 0, progress_rate: 0, correct_rate: nil }
    end

    it 'correct_rateをnullで返す' do
      expect(serialized['correct_rate']).to be_nil
    end
  end
end
