import { FindManyOptions, FindOptionsWhere, In, Repository } from 'typeorm'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'

export abstract class BaseService<T> {
  constructor(private readonly baseRepository: Repository<T>) {}

  getRepository() {
    return this.baseRepository
  }

  async create(
    createBaseDto: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[],
  ) {
    const insertResult = await this.baseRepository.insert(createBaseDto)
    const id = insertResult?.identifiers[0]?.id

    return this.baseRepository.findOneBy({
      id,
    } as unknown as FindOptionsWhere<T>)
  }

  findAll(
    conditions: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    otherOptions: Exclude<FindManyOptions<T>, 'where'> = {},
  ) {
    return this.baseRepository.find({
      where: conditions,
      ...otherOptions,
    })
  }

  findAllAndCount(
    conditions: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    otherOptions: Exclude<FindManyOptions<T>, 'where'> = {},
  ) {
    return this.baseRepository.findAndCount({
      where: conditions,
      ...otherOptions,
    })
  }

  findOne(
    conditions: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    otherOptions: Exclude<FindManyOptions<T>, 'where'> = {},
  ) {
    return this.baseRepository.findOne({ where: conditions, ...otherOptions })
  }

  findById(id: number) {
    return this.baseRepository.findOneBy({
      id,
    } as unknown as FindOptionsWhere<T>)
  }

  async update(id: number, updateBaseDto: QueryDeepPartialEntity<T>) {
    await this.baseRepository.update(
      { id } as unknown as FindOptionsWhere<T>,
      updateBaseDto,
    )

    return this.findById(id)
  }

  async delete(...ids: number[]) {
    return this.baseRepository.delete({
      id: In(ids),
    } as unknown as FindOptionsWhere<T>)
  }
}
