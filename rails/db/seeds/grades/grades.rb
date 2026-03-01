HighSchool.all.each do |school|
  Grade::DISPLAY_NAMES.each_with_index do |_, year|
    Grade.find_or_create_by!(
      high_school: school,
      year: year
    )
  end
end
