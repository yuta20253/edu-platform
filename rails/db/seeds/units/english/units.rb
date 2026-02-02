# frozen_string_literal: true

unit_names = ['文型', '時制・助動詞・仮定法', '準動詞・受動態', '関係詞', '前置詞・接続詞・疑問詞・仮定法']

1.upto(10) do |course_id|
  unit_names.each do |name|
    Unit.find_or_create_by!(course_id: course_id, unit_name: name)
  end
end
