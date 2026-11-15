# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Regexp.timeout設定' do
  it 'ReDoS対策として1秒のタイムアウトが設定されている' do
    expect(Regexp.timeout).to eq(1)
  end
end
