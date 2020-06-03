import cheerio, { load } from 'cheerio'
import fs from 'fs'
import { promisify } from 'util'
import { resolve } from 'path'

const readFile = promisify(fs.readFile)

export const readHtml = async (path: string) => {
  path = resolve(path)
  const buffer = await readFile(path, 'utf-8')
  return buffer.toString()
}

interface VoteCast {
  name: string
  present: boolean
}

interface Vote {
  cast: VoteCast[]
  count: number
  reason: string
  result: string
  type: 'Ayes' | 'Nays'
}

export const findVotes = (html: string) => {
  const $ = load(html)

  const countEls = $('.VoteCount')

  const result: Vote[] = []

  countEls.each((index, el) => {
    const $el = cheerio(el)
    const [type, count] = $el.text().split(' ')
    result.push({
      cast: findCastBy($el),
      count: parseInt(count, 10),
      reason: findReason($el),
      result: findResult($el),
      type: type === 'Ayes' ? 'Ayes' : 'Nays',
    })
  })

  return result
}

const findReason = (el: Cheerio) => {
  return el.siblings('.VoteReason').first().text()
}

const findResult = (el: Cheerio) => {
  return el.siblings('.VoteResult').first().text()
}

const findCastBy = (el: Cheerio) => {
  const casters: VoteCast[] = []

  const table = el.next('.table')
  table.find('td').each((index, td) => {
    const name = cheerio(td).text().trim()

    if (name && name !== 'Teller:') {
      casters.push({
        name: name.replace(/\s\(P\)/, ''),
        present: name.includes('(P)'),
      })
    }
  })

  return casters
}
