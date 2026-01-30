# frozen_string_literal: true

subject_names = %w[英語 数学 現代文 古文 日本史 世界史 地理 物理 化学 生物 地学]

subject_names.each do |name|
  Subject.create!(name: name)
end
