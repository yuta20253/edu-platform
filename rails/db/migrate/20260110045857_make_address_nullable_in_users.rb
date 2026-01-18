class MakeAddressNullableInUsers < ActiveRecord::Migration[7.1]
  def change
    change_column_null :users, :address_id, true
  end
end
