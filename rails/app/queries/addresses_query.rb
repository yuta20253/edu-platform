class AddressesQuery
  def initialize(prefecture_id:, city:, town:, relation: Address.all.includes(:prefecture))
    @relation = relation
    @prefecture_id = prefecture_id
    @city = city
    @town = town
  end

  def call
    filter_prefecture
    filter_city
    filter_town

    @relation
  end

  private

  def filter_prefecture
    return if @prefecture_id.blank?

    @relation = @relation.where(prefecture_id: @prefecture_id)
  end

  def filter_city
    return if @city.blank?

    @relation = @relation.where('city LIKE ?', "%#{@city}%")
  end

  def filter_town
    return if @town.blank?

    @relation = @relation.where('town LIKE ?', "%#{@town}%")
  end
end