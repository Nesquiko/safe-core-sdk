import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../utils/config'
import { getApiKit } from '../utils/setupKits'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getMultisigTransactions', () => {
  before(async () => {
    safeApiKit = getApiKit()
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getMultisigTransactions(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'.toLowerCase()
    await chai
      .expect(safeApiKit.getMultisigTransactions(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return an empty list if there are no multisig transactions', async () => {
    const safeAddress = '0x513697456eDb113aDCAA1bbDA5bE59D9D7A2efd1' // Safe without multisig transactions
    const safeMultisigTransactionListResponse =
      await safeApiKit.getMultisigTransactions(safeAddress)
    chai.expect(safeMultisigTransactionListResponse.count).to.be.equal(0)
    chai.expect(safeMultisigTransactionListResponse.results.length).to.be.equal(0)
  })

  it('should return the list of multisig transactions', async () => {
    const safeAddress = '0xCa2f5A815b642c79FC530B60BC15Aee4eF6252b3' // Safe with multisig transactions
    const safeMultisigTransactionListResponse =
      await safeApiKit.getMultisigTransactions(safeAddress)
    chai.expect(safeMultisigTransactionListResponse.count).to.be.equal(10)
    chai.expect(safeMultisigTransactionListResponse.results.length).to.be.equal(10)
    safeMultisigTransactionListResponse.results.map((transaction) => {
      chai.expect(transaction.safe).to.be.equal(safeAddress)
    })
  })

  it('should return the list of multisig transactions EIP-3770', async () => {
    const safeAddress = '0xCa2f5A815b642c79FC530B60BC15Aee4eF6252b3' // Safe with multisig transactions
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const safeMultisigTransactionListResponse =
      await safeApiKit.getMultisigTransactions(eip3770SafeAddress)
    chai.expect(safeMultisigTransactionListResponse.count).to.be.equal(10)
    chai.expect(safeMultisigTransactionListResponse.results.length).to.be.equal(10)
    safeMultisigTransactionListResponse.results.map((transaction) => {
      chai.expect(transaction.safe).to.be.equal(safeAddress)
    })
  })
})
