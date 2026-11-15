# frozen_string_literal: true

require 'rails_helper'

# rubocop:disable RSpec/DescribeClass -- config/initializers/regexp_timeout.rbの設定値を検証するテストで、対象がクラス/モジュールではない
RSpec.describe 'Regexp.timeout設定' do
  it 'ReDoS対策として1秒のタイムアウトが設定されている' do
    expect(Regexp.timeout).to eq(1)
  end
end
# rubocop:enable RSpec/DescribeClass
