import { CinemaSeat } from '@entities'
import dataSource from '@shared/configs/data-source.config'
import { Repository } from 'typeorm'

export class CinemaSeatRepository extends Repository<CinemaSeat> {
  constructor() {
    super(CinemaSeat, dataSource.manager)
  }

  public async calculatePriceOfTicket(id: number): Promise<number> {
    const seat = await this.createQueryBuilder('cinemaSeat')
      .leftJoinAndSelect('cinemaSeat.cinemaRoom', 'cinemaRoom')
      .leftJoinAndSelect('cinemaRoom.cinema', 'cinema')
      .leftJoinAndSelect('cinemaSeat.seatType', 'seatType')
      .select(['cinema.basePrice', 'seatType.surcharge'])
      .where('cinemaSeat.id = :id')
      .setParameters({ id })
      .getRawOne()
    return +seat['cinema_base_price'] + +seat['seatType_surcharge']
  }

  public async calculateTotalPrice(cinemaSeatsId: number[]): Promise<number> {
    let totalPrice = 0
    for (let i = 0; i < cinemaSeatsId.length; i++) {
      const price = await this.calculatePriceOfTicket(cinemaSeatsId[i])
      totalPrice += price
    }
    return totalPrice
  }
}
